import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Pet bounding box data class
class PetBounds {
  final int x;
  final int y;
  final int width;
  final int height;
  final bool valid;

  const PetBounds({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.valid,
  });

  @override
  String toString() =>
      'PetBounds(x: $x, y: $y, w: $width, h: $height, valid: $valid)';
}

/// Service for communicating with native C++ code for window management.
/// Handles the MethodChannel communication for updating pet bounds
/// which determines click-through behavior.
class WindowChannel {
  static const _channel = MethodChannel('com.knightfocus/pet_bounds');

  /// Singleton instance
  static final WindowChannel instance = WindowChannel._();

  WindowChannel._();

  /// Update pet bounding box for click-through hit testing.
  /// Called when pet position or size changes.
  ///
  /// The native C++ code uses these bounds to determine if mouse clicks
  /// should be captured (when over the pet) or passed through to windows below.
  Future<bool> updatePetBounds({
    required int x,
    required int y,
    required int width,
    required int height,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>(
        'updatePetBounds',
        {
          'x': x,
          'y': y,
          'width': width,
          'height': height,
        },
      );
      return result ?? false;
    } on PlatformException catch (e) {
      debugPrint('Failed to update pet bounds: ${e.message}');
      return false;
    }
  }

  /// Clear pet bounds (makes entire window click-through)
  Future<bool> clearPetBounds() async {
    try {
      final result = await _channel.invokeMethod<bool>('clearPetBounds');
      return result ?? false;
    } on PlatformException catch (e) {
      debugPrint('Failed to clear pet bounds: ${e.message}');
      return false;
    }
  }

  /// Get current pet bounds from native code
  Future<PetBounds?> getPetBounds() async {
    try {
      final result = await _channel.invokeMethod<Map>('getPetBounds');
      if (result == null) return null;

      return PetBounds(
        x: result['x'] as int,
        y: result['y'] as int,
        width: result['width'] as int,
        height: result['height'] as int,
        valid: result['valid'] as bool,
      );
    } on PlatformException catch (e) {
      debugPrint('Failed to get pet bounds: ${e.message}');
      return null;
    }
  }
}
