import React from 'react';
import { Text } from 'react-native';

type Props = {
  en: string;
  ur: string;
  style?: any;
};

export default function BiText({ en, ur, style }: Props) {
  return (
    <Text style={style}>
      {en} / {ur}
    </Text>
  );
}


