import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';

type Particle = {
  id: number;
  size: number;
  left: number;
  top: number;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
};

type ParticleAnimation = {
  translateY: Animated.Value;
  translateX: Animated.Value;
  opacity: Animated.Value;
};

export default function Particles({ count = 20 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      size: 8 + Math.floor(Math.random() * 11),
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: 0.22 + Math.random() * 0.28,
      duration: 10000 + Math.floor(Math.random() * 12000),
      delay: Math.floor(Math.random() * 5000),
      driftX: -28 + Math.random() * 56,
      driftY: 24 + Math.random() * 20,
    }));
  }, [count]);

  const animations = useMemo<ParticleAnimation[]>(() => {
    return particles.map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }));
  }, [particles]);

  useEffect(() => {
    const stopAnimations = animations.map((animation, index) => {
      const particle = particles[index];
      const translateY = animation.translateY;
      const translateX = animation.translateX;
      const opacity = animation.opacity;

      opacity.setValue(particle.opacity);

      const floatYAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -particle.driftY,
            duration: particle.duration,
            delay: particle.delay,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: particle.duration,
            useNativeDriver: true,
          }),
        ])
      );

      const floatXAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: particle.driftX,
            duration: particle.duration + 2000,
            delay: particle.delay,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: particle.duration + 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: particle.opacity * 0.55,
            duration: particle.duration / 2,
            delay: particle.delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: particle.opacity,
            duration: particle.duration / 2,
            useNativeDriver: true,
          }),
        ])
      );

      floatYAnimation.start();
      floatXAnimation.start();
      pulseAnimation.start();

      return () => {
        floatYAnimation.stop();
        floatXAnimation.stop();
        pulseAnimation.stop();
      };
    });

    return () => {
      stopAnimations.forEach((stop) => stop());
    };
  }, [animations, particles]);

  return (
    <Animated.View pointerEvents="none" style={styles.container}>
      {particles.map((particle, index) => {
        const animation = animations[index];

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                opacity: animation.opacity,
                transform: [{ translateY: animation.translateY }, { translateX: animation.translateX }],
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'white',
  },
});
