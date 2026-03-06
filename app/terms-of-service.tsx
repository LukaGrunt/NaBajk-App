import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import Colors from '@/constants/Colors';

const content = {
  sl: [
    {
      heading: 'Sprejetje pogojev',
      body: 'Z uporabo aplikacije NaBajk sprejemate te Pogoje uporabe. Če se ne strinjate, aplikacije ne smete uporabljati.',
    },
    {
      heading: 'Brezplačna storitev — brez garancij',
      body: 'NaBajk je brezplačna platforma, ki se zagotavlja „takšna kot je", brez kakršnih koli garancij za neprekinjeno delovanje, točnost podatkov ali primernost za določen namen.',
    },
    {
      heading: 'Kolesarstvo je nevarno',
      body: 'Kolesarstvo je telesna aktivnost, ki v sebi nosi tveganje. Aplikacijo NaBajk in njene vsebine uporabljate izključno na lastno odgovornost. NaBajk ne prevzema nobene odgovornosti za nesreče, telesne poškodbe, smrt, poškodbe premoženja, globe ali kakršno koli drugo škodo, ki bi nastala z uporabo aplikacije ali njenih vsebin.',
    },
    {
      heading: 'Natančnost poti',
      body: 'Vse poti in skupinske vožnje so ustvarjene s strani uporabnikov — NaBajk ne preverja njihove točnosti, zakonitosti ali varnosti. Poti lahko vsebujejo napake: nepravilne trase, ceste, ki niso namenjene kolesarjem, zasebno zemljišče ali nelegalne odseke.\n\nPred vsakim izhodom vizualno preverite in načrtujte svojo pot.',
    },
    {
      heading: 'Prometna zakonodaja',
      body: 'Izključno vi ste odgovorni za upoštevanje vseh veljavnih prometnih predpisov in zakonodaje v vaši jurisdikciji. NaBajk ne nosi nobene odgovornosti za kršitve prometnih predpisov.',
    },
    {
      heading: 'Skupinske vožnje',
      body: 'Z udeležbo ali organizacijo skupinske vožnje v celoti sprejemate osebno odgovornost za svojo udeležbo. Spoštujte druge udeležence v prometu, pešce in zasebno lastnino.',
    },
    {
      heading: 'Omejitev odgovornosti',
      body: 'NaBajk, njegovi lastniki in sodelavci v nobenem primeru niso odgovorni za kakršno koli neposredno, posredno, naključno ali posledično škodo, ki izhaja iz uporabe aplikacije ali njenih vsebin.',
    },
    {
      heading: 'Vsebina uporabnikov',
      body: 'Pridržujemo si pravico, da brez predhodnega obvestila odstranimo vsebino ali račune, ki kršijo te pogoje ali veljavno zakonodajo.',
    },
    {
      heading: 'Veljavno pravo',
      body: 'Te pogoje ureja pravo Republike Slovenije. Vsi spori se rešujejo pred pristojnimi slovenskimi sodišči.\n\nPogoji se lahko posodobijo. Nadaljnja uporaba aplikacije pomeni sprejetje sprememb.',
    },
  ],
  en: [
    {
      heading: 'Acceptance of terms',
      body: 'By using the NaBajk app you accept these Terms of Service. If you do not agree, you must not use the app.',
    },
    {
      heading: 'Free service — no warranties',
      body: 'NaBajk is a free platform provided "as is", without any warranties of continuous availability, data accuracy, or fitness for a particular purpose.',
    },
    {
      heading: 'Cycling is dangerous',
      body: 'Cycling is a physical activity that carries inherent risk. You use NaBajk and its content entirely at your own risk. NaBajk is not liable for accidents, personal injury, death, property damage, fines, or any other loss or damage arising from use of the app or its content.',
    },
    {
      heading: 'Route accuracy',
      body: 'All routes and group rides are user-generated — NaBajk does not verify their accuracy, legality, or safety. Routes may contain errors: incorrect paths, roads not designated for cyclists, privately owned land, or illegal sections.\n\nAlways visually inspect and plan your route before riding.',
    },
    {
      heading: 'Traffic law compliance',
      body: 'You are solely responsible for complying with all applicable traffic laws and regulations in your jurisdiction. NaBajk bears no liability for traffic violations.',
    },
    {
      heading: 'Group rides',
      body: 'By joining or organising a group ride you accept full personal responsibility for your participation. Respect other road users, pedestrians, and private property.',
    },
    {
      heading: 'Limitation of liability',
      body: 'NaBajk, its owners and contributors are not liable under any circumstances for any direct, indirect, incidental, or consequential damages arising from use of the app or its content.',
    },
    {
      heading: 'User content',
      body: 'We reserve the right to remove content or accounts that violate these terms or applicable law without notice.',
    },
    {
      heading: 'Governing law',
      body: 'These terms are governed by the law of the Republic of Slovenia. All disputes are subject to the jurisdiction of Slovenian courts.\n\nTerms may be updated. Continued use of the app constitutes acceptance of any changes.',
    },
  ],
};

export default function TermsOfServiceScreen() {
  const { language } = useLanguage();
  const sections = content[language];

  return (
    <>
      <Stack.Screen options={{ title: t(language, 'termsOfServiceTitle'), headerShown: true }} />
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
