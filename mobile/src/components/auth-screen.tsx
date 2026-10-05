import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const theme = useTheme();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!email || !password || (mode === 'signup' && !fullName)) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    setSubmitting(true);
    const message =
      mode === 'login' ? await signIn(email, password) : await signUp(email, password, fullName);
    setSubmitting(false);

    if (message) {
      setError(message);
      return;
    }

    if (mode === 'signup') {
      setSignupDone(true);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <ThemedText type="title" style={styles.title}>
              Scald Coffee
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              {mode === 'login' ? 'Hesabınla giriş yap' : 'Yeni bir hesap oluştur'}
            </ThemedText>

            {signupDone ? (
              <ThemedView type="backgroundElement" style={styles.infoCard}>
                <ThemedText type="default">Kayıt başarılı!</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  E-postana gelen doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsin.
                </ThemedText>
                <Pressable
                  onPress={() => {
                    setMode('login');
                    setSignupDone(false);
                  }}>
                  <ThemedText type="linkPrimary" themeColor="primary">
                    Giriş ekranına dön
                  </ThemedText>
                </Pressable>
              </ThemedView>
            ) : (
              <>
                <View style={styles.form}>
                  {mode === 'signup' && (
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Ad Soyad"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="words"
                      style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                    />
                  )}
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-posta"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Şifre"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                </View>

                {error && (
                  <ThemedText type="small" style={styles.error}>
                    {error}
                  </ThemedText>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.submitButton,
                    { backgroundColor: theme.primary, opacity: pressed || submitting ? 0.7 : 1 },
                  ]}>
                  <ThemedText type="smallBold" style={styles.submitButtonText}>
                    {submitting ? 'Lütfen bekleyin...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                  }}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.switchModeText}>
                    {mode === 'login'
                      ? 'Hesabın yok mu? Kayıt ol'
                      : 'Zaten hesabın var mı? Giriş yap'}
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  form: {
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: {
    color: '#D3453B',
  },
  submitButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
  },
  switchModeText: {
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
