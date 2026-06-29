import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/home/placeholder_screen.dart';

/// App router. Phase 0 has a single themed placeholder route; Phase 1 adds the
/// auth gate (redirect) plus login / register / onboarding / catalog routes.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const PlaceholderScreen(),
      ),
    ],
  );
});
