import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedView type="primary" style={styles.hero}>
              <SafeAreaView edges={['top']}>
                <Image
                  source={require('@/assets/images/brand/scald-logo-trimmed.png')}
                  style={styles.logo}
                  contentFit="contain"
                  tintColor="#ffffff"
                />
                <ThemedText type="small" style={styles.heroSubtitle}>
                  {mode === 'login' ? 'Hesabınla giriş yap' : 'Yeni bir hesap oluştur'}
                </ThemedText>
              </SafeAreaView>
            </ThemedView>

            <View style={styles.cardWrapper}>
              <ThemedView type="backgroundElement" style={styles.card}>
                {signupDone ? (
                  <View style={styles.successState}>
                    <View style={[styles.successIcon, { backgroundColor: theme.backgroundSelected }]}>
                      <Ionicons name="checkmark-circle" size={40} color={theme.primary} />
                    </View>
                    <ThemedText type="default" style={styles.successTitle}>
                      Kayıt başarılı!
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.successBody}>
                      E-postana gelen doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsin.
                    </ThemedText>
                    <Pressable
                      onPress={() => {
                        setMode('login');
                        setSignupDone(false);
                      }}
                      style={styles.successLink}>
                      <ThemedText type="linkPrimary" themeColor="primary">
                        Giriş ekranına dön
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.form}>
                      {mode === 'signup' && (
                        <View
                          style={[
                            styles.inputRow,
                            { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                          ]}>
                          <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                          <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Ad Soyad"
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize="words"
                            style={[styles.input, { color: theme.text }]}
                          />
                        </View>
                      )}
                      <View
                        style={[
                          styles.inputRow,
                          { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                        ]}>
                        <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder="E-posta"
                          placeholderTextColor={theme.textSecondary}
                          autoCapitalize="none"
                          autoComplete="email"
                          keyboardType="email-address"
                          style={[styles.input, { color: theme.text }]}
                        />
                      </View>
                      <View
                        style={[
                          styles.inputRow,
                          { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                        ]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Şifre"
                          placeholderTextColor={theme.textSecondary}
                          secureTextEntry
                          autoCapitalize="none"
                          style={[styles.input, { color: theme.text }]}
                        />
                      </View>
                    </View>

                    {error && (
                      <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={18} color="#D3453B" />
                        <ThemedText type="small" style={styles.error}>
                          {error}
                        </ThemedText>
                      </View>
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
                      {!submitting && <Ionicons name="arrow-forward" size={18} color="#ffffff" />}
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setError(null);
                      }}
                      style={styles.switchModeRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
                      </ThemedText>
                      <ThemedText type="smallBold" themeColor="primary">
                        {mode === 'login' ? ' Kayıt ol' : ' Giriş yap'}
                      </ThemedText>
                    </Pressable>
                  </>
                )}
              </ThemedView>
            </View>
          </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
  },
  logo: {
    width: 220,
    height: 66,
    marginBottom: Spacing.two,
  },
  heroTitle: {
    color: '#ffffff',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  cardWrapper: {
    paddingHorizontal: Spacing.four,
    marginTop: -Spacing.five,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  form: {
    gap: Spacing.three,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.one,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(211,69,59,0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  error: {
    flex: 1,
    color: '#D3453B',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
  },
  submitButtonText: {
    color: '#ffffff',
  },
  switchModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  successTitle: {
    textAlign: 'center',
  },
  successBody: {
    textAlign: 'center',
  },
  successLink: {
    marginTop: Spacing.two,
  },
});
