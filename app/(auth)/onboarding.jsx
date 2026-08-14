import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import CustomButton from '../../components/ui/CustomButton';
import ScreenWrapper from '../../components/layout/ScreenWrapper';
import IaLogo from '../../assets/images/IaLogo.png'
import ArtisanLogo from '../../assets/images/ArtisanLogo.png'
import ContactLogo from '../../assets/images/ContactLogo.png'

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Discutez avec notre IA',
    description: 'Exprimez votre besoin en texte ou par message vocal comme sur votre messagerie préférée. Notre IA comprend tout instantanément.',
    image: IaLogo,
  },
  {
    id: '2',
    title: "Trouvez l'artisan idéal",
    description: 'Recevez instantanément les recommandations des meilleurs prestataires (plombiers, électriciens, livreurs) disponibles dans votre commune.',
    image: ArtisanLogo,
  },
  {
    id: '3',
    title: 'Contactez en un clic',
    description: 'Appelez directement le professionnel par GSM ou lancez une discussion sur WhatsApp pour finaliser votre prestation en toute simplicité.',
    image: ContactLogo,
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        {/* Image d'illustration dynamique selon la slide active */}
        <View style={styles.imagePlaceholder}>
          <Image
            source={slide.image}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        {/* Indicateurs de points */}
        <View style={styles.dotContainer}>
          {SLIDES.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentIndex === index && styles.activeDot
              ]} 
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <CustomButton 
          title={currentIndex === SLIDES.length - 1 ? "Commencer" : "Suivant"} 
          onPress={handleNext} 
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  imagePlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: Colors.gray,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
  },
  illustrationImage: {
    width: '85%',
    height: '85%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  footer: {
    paddingBottom: 20,
  }
});
