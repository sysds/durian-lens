import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../models/store_model.dart';
import '../services/location_service.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final LocationService _locationService = LocationService();
  GoogleMapController? _mapController;
  Position? _position;
  List<DurianStore> _nearbyStores = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _initMap();
  }

  Future<void> _initMap() async {
    final pos = await _locationService.getCurrentPosition();
    if (pos != null) {
      _position = pos;
      _nearbyStores = _locationService.getNearbyStores(pos.latitude, pos.longitude, radiusKm: 100);
    } else {
      // Default to KL if no permission
      _nearbyStores = _locationService.getNearbyStores(3.1390, 101.6869, radiusKm: 100);
    }
    setState(() => _loading = false);
  }

  Set<Marker> _buildMarkers() {
    final markers = <Marker>{};

    for (final store in _nearbyStores) {
      markers.add(
        Marker(
          markerId: MarkerId(store.id),
          position: LatLng(store.latitude, store.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: store.name,
            snippet: '${store.address}${store.phone != null ? ' • ${store.phone}' : ''}',
          ),
        ),
      );
    }

    if (_position != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('user'),
          position: LatLng(_position!.latitude, _position!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: const InfoWindow(title: 'You are here'),
        ),
      );
    }

    return markers;
  }

  CameraPosition get _initialCameraPosition {
    if (_position != null) {
      return CameraPosition(
        target: LatLng(_position!.latitude, _position!.longitude),
        zoom: 12,
      );
    }
    return const CameraPosition(target: LatLng(3.1390, 101.6869), zoom: 10);
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF1F8E9),
      appBar: AppBar(
        title: const Text('Nearby Durian Stores'),
        backgroundColor: Colors.green.shade700,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  flex: 3,
                  child: GoogleMap(
                    mapType: MapType.normal,
                    initialCameraPosition: _initialCameraPosition,
                    markers: _buildMarkers(),
                    myLocationEnabled: _position != null,
                    myLocationButtonEnabled: true,
                    onMapCreated: (controller) => _mapController = controller,
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: _nearbyStores.isEmpty
                      ? const Center(child: Text('No stores found nearby'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _nearbyStores.length,
                          itemBuilder: (context, index) {
                            final store = _nearbyStores[index];
                            return Card(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: Colors.green.shade100,
                                  child: const Icon(Icons.store, color: Colors.green),
                                ),
                                title: Text(store.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text(store.address),
                                trailing: store.rating > 0
                                    ? Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.star, size: 16, color: Colors.amber),
                                          Text(store.rating.toStringAsFixed(1)),
                                        ],
                                      )
                                    : null,
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
