import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../native/window_channel.dart';

/// State class for pet bounds
class PetBoundsState {
  final int x;
  final int y;
  final int width;
  final int height;
  final bool isUpdating;

  const PetBoundsState({
    this.x = 0,
    this.y = 0,
    this.width = 120, // Default knight sprite width
    this.height = 80, // Default knight sprite height
    this.isUpdating = false,
  });

  PetBoundsState copyWith({
    int? x,
    int? y,
    int? width,
    int? height,
    bool? isUpdating,
  }) {
    return PetBoundsState(
      x: x ?? this.x,
      y: y ?? this.y,
      width: width ?? this.width,
      height: height ?? this.height,
      isUpdating: isUpdating ?? this.isUpdating,
    );
  }
}

/// Provider for managing pet bounds state
final petBoundsProvider =
    StateNotifierProvider<PetBoundsNotifier, PetBoundsState>((ref) {
  return PetBoundsNotifier();
});

/// Notifier that manages pet bounds and syncs with native code
class PetBoundsNotifier extends StateNotifier<PetBoundsState> {
  PetBoundsNotifier() : super(const PetBoundsState());

  Timer? _debounceTimer;
  static const _debounceDelay = Duration(milliseconds: 16); // ~60fps

  /// Update pet bounds with debouncing to avoid flooding native code
  void updateBounds(int x, int y, int width, int height) {
    state = state.copyWith(x: x, y: y, width: width, height: height);

    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounceDelay, () {
      _syncToNative();
    });
  }

  /// Immediately sync to native (use for initial setup)
  Future<void> syncNow() async {
    _debounceTimer?.cancel();
    await _syncToNative();
  }

  Future<void> _syncToNative() async {
    state = state.copyWith(isUpdating: true);

    await WindowChannel.instance.updatePetBounds(
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
    );

    state = state.copyWith(isUpdating: false);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    WindowChannel.instance.clearPetBounds();
    super.dispose();
  }
}
