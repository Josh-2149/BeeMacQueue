import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function BrandLogo({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.wrapper, { width: size, height: size }]}> 
      <Image
        source={require('../assets/logo.jpg')}
        style={[styles.image, { width: size, height: size, borderRadius: size * 0.2 }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
