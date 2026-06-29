/// Build-time environment configuration.
///
/// Override the API base URL without code changes:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000/api/v1
class Env {
  Env._();

  /// Base URL of the EduStream API, no trailing slash.
  ///
  /// Defaults suit desktop/web/iOS-simulator. For the **Android emulator**,
  /// `localhost` is the emulator itself — use the host alias `10.0.2.2`:
  ///   --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );
}
