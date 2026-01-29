import 'package:flame/components.dart';
import 'package:flame/events.dart';

import '../animations/knight_animation_controller.dart';

/// Callback type for position changes
typedef PositionChangedCallback =
    void Function(double x, double y, double width, double height);

/// Main knight sprite component with animation and drag support
class KnightComponent extends SpriteAnimationComponent
    with DragCallbacks, TapCallbacks {
  final PositionChangedCallback? onPositionChanged;
  final String colorVariant;
  final String styleVariant;

  late final KnightAnimationController animationController;

  // Sprite sheet constants
  static const double frameWidth = 120.0;
  static const double frameHeight = 80.0;

  // State tracking
  bool _isDragging = false;
  bool _facingRight = true;

  KnightComponent({
    this.onPositionChanged,
    this.colorVariant = 'Colour1',
    this.styleVariant = 'Outline',
  }) : super(size: Vector2(frameWidth, frameHeight), anchor: Anchor.center);

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    // Initialize animation controller
    animationController = KnightAnimationController(
      component: this,
      colorVariant: colorVariant,
      styleVariant: styleVariant,
    );
    await animationController.loadAnimations();

    // Set initial animation
    animationController.playAnimation(KnightAnimationType.idle);

    // Notify initial position
    _notifyPositionChanged();
  }

  @override
  void update(double dt) {
    super.update(dt);
    animationController.update(dt);
  }

  @override
  void onDragStart(DragStartEvent event) {
    super.onDragStart(event);
    _isDragging = true;
    animationController.playAnimation(KnightAnimationType.jump);
  }

  @override
  void onDragUpdate(DragUpdateEvent event) {
    position += event.localDelta;

    // Update facing direction based on drag direction
    if (event.localDelta.x > 0.5) {
      _facingRight = true;
      scale = Vector2(1, 1);
    } else if (event.localDelta.x < -0.5) {
      _facingRight = false;
      scale = Vector2(-1, 1); // Flip horizontally
    }

    _notifyPositionChanged();
  }

  @override
  void onDragEnd(DragEndEvent event) {
    super.onDragEnd(event);
    _isDragging = false;
    animationController.playAnimation(KnightAnimationType.fall);

    // Return to idle after landing animation
    Future.delayed(const Duration(milliseconds: 300), () {
      if (!_isDragging) {
        animationController.playAnimation(KnightAnimationType.idle);
      }
    });
  }

  @override
  void onTapDown(TapDownEvent event) {
    super.onTapDown(event);
    // Poke reaction - play attack animation
    animationController.playAnimation(KnightAnimationType.attack);
  }

  void _notifyPositionChanged() {
    if (onPositionChanged != null) {
      // Calculate top-left corner from center position
      final topLeft = position - size / 2;
      onPositionChanged!(topLeft.x, topLeft.y, size.x, size.y);
    }
  }

  /// Make the knight run in a direction
  void run({bool right = true}) {
    _facingRight = right;
    scale = Vector2(right ? 1 : -1, 1);
    animationController.playAnimation(KnightAnimationType.run);
  }

  /// Stop running and return to idle
  void stopRunning() {
    animationController.playAnimation(KnightAnimationType.idle);
  }

  /// Play a reaction animation (poke response)
  void react() {
    animationController.playAnimation(KnightAnimationType.hit);
  }

  bool get isDragging => _isDragging;
  bool get facingRight => _facingRight;
}
