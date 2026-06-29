import 'package:flutter/material.dart';
import '../../core/env/env.dart';
import '../../core/theme/tokens.dart';

/// Phase 0 themed placeholder. It exists to prove the design system is wired —
/// it shows the type scale, neutral + brand + semantic colours, the spacing
/// scale, and the three button intents (primary / tonal / text). The real
/// onboarding + catalog screens replace this from Phase 1 onward.
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.xxl,
            AppSpacing.xl,
            AppSpacing.xl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PHASE 0 · SCAFFOLD',
                style: t.labelSmall?.copyWith(
                  color: AppColors.brand,
                  letterSpacing: 1.4,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text('EduStream', style: t.displayLarge),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'ESG & sustainability education — built for Central Asia, '
                'ready for the world.',
                style: t.bodyLarge?.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xl),
              _StatusCard(apiBaseUrl: Env.apiBaseUrl),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {},
                  child: const Text('Get started'),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: () {},
                  child: const Text('Explore catalog'),
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Center(
                child: TextButton(
                  onPressed: () {},
                  child: const Text('I already have an account'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.apiBaseUrl});

  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: AppElevation.card,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: AppColors.successSubtle,
              borderRadius: BorderRadius.circular(AppRadius.pill),
            ),
            child: Text(
              'DESIGN SYSTEM ONLINE',
              style: t.labelSmall?.copyWith(
                color: AppColors.success,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text('Tokens · Theme · GoRouter · Riverpod', style: t.titleMedium),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'The scaffolding is wired and the app talks to:',
            style: t.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            apiBaseUrl,
            style: t.bodyMedium?.copyWith(
              color: AppColors.brand,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
