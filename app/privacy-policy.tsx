import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import Colors from '@/constants/Colors';

const content = {
  sl: [
    {
      heading: 'Kaj zbiramo',
      body: 'NaBajk zbira izključno vaš e-poštni naslov, ki ga uporabljamo zgolj za preverjanje identitete ob prijavi (magic link ali Google Sign-In). E-poštnega naslova ne delimo z nikomer in ga ne prodajamo.\n\nIzberete si lahko prikazno ime ali vzdevek — pravo ime ni zahtevano niti shranjeno. Trajnih lokacijskih podatkov ne shranjujemo in ne ustvarjamo oglasnih profilov.',
    },
    {
      heading: 'Kako podatke uporabljamo',
      body: 'Vaš e-poštni naslov je edini osebni podatek, ki ga obdelujemo. Uporablja se izključno za pošiljanje prijave in zagotavljanje dostopa do računa. NaBajk ne izvaja vedenjskega sledenja in ne prikazuje oglasov.',
    },
    {
      heading: 'Shranjevanje in varnost',
      body: 'Vaši podatki so shranjeni na infrastrukturi Supabase, ki deluje na strežnikih v Evropski uniji. Supabase zagotavlja šifriranje podatkov med prenosom in v mirovanju.',
    },
    {
      heading: 'Vaše pravice',
      body: 'Račun in vse s tem povezane podatke lahko kadar koli izbrišete neposredno v aplikaciji (Nastavitve → Izbriši račun). Za ostala vprašanja nas kontaktirajte na: nabajk.si@gmail.com',
    },
    {
      heading: 'Kontakt',
      body: 'Za vsa vprašanja v zvezi z zasebnostjo nas kontaktirajte na: nabajk.si@gmail.com\n\nPolitika zasebnosti se lahko posodobi. Nadaljnja uporaba aplikacije pomeni sprejetje sprememb.',
    },
  ],
  en: [
    {
      heading: 'What we collect',
      body: 'NaBajk collects only your email address, used solely to verify your identity when signing in (magic link or Google Sign-In). We never share or sell your email address.\n\nYou choose your own display name or nickname — no real name is required or stored. We do not store permanent location data and we do not build advertising profiles.',
    },
    {
      heading: 'How we use your data',
      body: 'Your email address is the only personal data we process. It is used exclusively to send you a sign-in link and to provide access to your account. NaBajk does not perform behavioural tracking and does not show advertisements.',
    },
    {
      heading: 'Storage and security',
      body: 'Your data is stored on Supabase infrastructure running on servers in the European Union. Supabase provides encryption of data in transit and at rest.',
    },
    {
      heading: 'Your rights',
      body: 'You can delete your account and all associated data at any time directly in the app (Settings → Delete Account). For other questions contact us at: nabajk.si@gmail.com',
    },
    {
      heading: 'Contact',
      body: 'For any privacy-related questions contact us at: nabajk.si@gmail.com\n\nThis policy may be updated. Continued use of the app constitutes acceptance of any changes.',
    },
  ],
};

export default function PrivacyPolicyScreen() {
  const { language } = useLanguage();
  const sections = content[language];

  return (
    <>
      <Stack.Screen options={{ title: t(language, 'privacyPolicyTitle'), headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: 40,
  },
});
