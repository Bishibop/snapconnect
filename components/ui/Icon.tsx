import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Icons, IconKey } from '../../constants/icons';
import { theme } from '../../constants/theme';

interface IconProps {
  name: IconKey;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function Icon({
  name,
  size = 24,
  color = theme.colors.secondary,
  style,
}: IconProps) {
  const iconConfig = Icons[name];
  const IconComponent = iconConfig.component;

  return (
    <View style={style}>
      <IconComponent name={iconConfig.name as any} size={size} color={color} />
    </View>
  );
}
