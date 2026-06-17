"""
Durian Lens — Model Training Script
Fine-tunes EfficientNet-B4 on a durian dataset.

Dataset structure expected:
  data/
    train/
      black-thorn/  (*.jpg, *.png)
      d24/
      musang-king/
    val/
      black-thorn/
      d24/
      musang-king/
    test/
      black-thorn/
      d24/
      musang-king/

Usage:
  python train.py --data_dir ./data --epochs 30 --batch_size 32
"""

import argparse
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision.transforms as T
from torchvision import datasets
from torchvision.models import efficientnet_b4, EfficientNet_B4_Weights
from torch.optim.lr_scheduler import CosineAnnealingLR

from sklearn.metrics import classification_report
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger("train")

CLASSES = ["black-thorn", "d24", "musang-king"]


def get_transforms():
    """Data augmentation for training, minimal for val/test."""
    train_tf = T.Compose([
        T.RandomResizedCrop(224, scale=(0.7, 1.0)),
        T.RandomHorizontalFlip(),
        T.RandomVerticalFlip(p=0.2),
        T.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        T.RandomRotation(15),
        T.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    val_tf = T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    return train_tf, val_tf


def build_model(num_classes: int) -> nn.Module:
    model = efficientnet_b4(weights=EfficientNet_B4_Weights.IMAGENET1K_V1)

    # Freeze backbone layers initially
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 512),
        nn.ReLU(inplace=False),
        nn.Dropout(p=0.2),
        nn.Linear(512, num_classes),
    )

    return model


def unfreeze_backbone(model: nn.Module, unfreeze_from: int = -3):
    """Gradually unfreeze the last N feature blocks."""
    layers = list(model.features.children())
    for layer in layers[unfreeze_from:]:
        for param in layer.parameters():
            param.requires_grad = True
    logger.info(f"Unfroze last {abs(unfreeze_from)} feature blocks")


def train_epoch(model, loader, criterion, optimizer, device, scaler):
    model.train()
    total_loss, correct, total = 0.0, 0, 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()

        with torch.cuda.amp.autocast(enabled=scaler is not None):
            outputs = model(images)
            loss = criterion(outputs, labels)

        if scaler:
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

        total_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += images.size(0)

    return total_loss / total, correct / total


@torch.no_grad()
def eval_epoch(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_labels = [], []

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += images.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    return total_loss / total, correct / total, all_preds, all_labels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="./data")
    parser.add_argument("--output_dir", type=str, default="./models")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--unfreeze_epoch", type=int, default=5)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training on: {device}")

    Path(args.output_dir).mkdir(parents=True, exist_ok=True)

    train_tf, val_tf = get_transforms()
    train_ds = datasets.ImageFolder(f"{args.data_dir}/train", transform=train_tf)
    val_ds = datasets.ImageFolder(f"{args.data_dir}/val", transform=val_tf)
    test_ds = datasets.ImageFolder(f"{args.data_dir}/test", transform=val_tf)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0, pin_memory=False)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0, pin_memory=False)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)
    
    logger.info(f"Train: {len(train_ds)}, Val: {len(val_ds)}, Test: {len(test_ds)}")
    logger.info(f"Classes: {train_ds.classes}")

    model = build_model(len(CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)
    scaler = torch.cuda.amp.GradScaler() if device.type == "cuda" else None

    best_val_acc = 0.0
    history = []

    for epoch in range(1, args.epochs + 1):
        # Gradually unfreeze
        if epoch == args.unfreeze_epoch:
            unfreeze_backbone(model, unfreeze_from=-3)
            optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr * 0.1, weight_decay=1e-4)

        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device, scaler)
        val_loss, val_acc, _, _ = eval_epoch(model, val_loader, criterion, device)
        scheduler.step()

        logger.info(
            f"Epoch {epoch:03d}/{args.epochs} | "
            f"Train: loss={train_loss:.4f} acc={train_acc:.4f} | "
            f"Val: loss={val_loss:.4f} acc={val_acc:.4f}"
        )

        history.append({"epoch": epoch, "train_loss": train_loss, "train_acc": train_acc, "val_loss": val_loss, "val_acc": val_acc})

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "classes": CLASSES,
            }, f"{args.output_dir}/durian_efficientnet_b4.pth")
            logger.info(f"  ✅ Saved best model (val_acc={val_acc:.4f})")

    # Final test evaluation
    _, test_acc, preds, labels = eval_epoch(model, test_loader, criterion, device)
    logger.info(f"\n{'='*50}")
    logger.info(f"Test Accuracy: {test_acc:.4f}")
    logger.info("\nClassification Report:")
    logger.info(classification_report(labels, preds, target_names=CLASSES))

    with open(f"{args.output_dir}/training_history.json", "w") as f:
        json.dump({"history": history, "best_val_acc": best_val_acc, "test_acc": test_acc}, f, indent=2)

    logger.info(f"Training complete. Best val acc: {best_val_acc:.4f}")


if __name__ == "__main__":
    main()