import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

interface RemoteImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
  onError?: (error: any) => void;
}

export function RemoteImage({ uri, style, contentFit = 'cover', onError }: RemoteImageProps) {
  return (
    <ExpoImage
      source={uri}
      style={style}
      contentFit={contentFit}
      cachePolicy="disk"
      onError={onError}
    />
  );
}
