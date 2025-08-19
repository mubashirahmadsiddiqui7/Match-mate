import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { s, theme } from '../styles';

export default function PhotoCard({
  photoUri, onChange,
}: { photoUri?: string; onChange: (uri?: string) => void }) {
  const takePhoto = async () => {
    const res = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (!res.didCancel) onChange(res.assets?.[0]?.uri);
  };
  const pickFromGallery = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!res.didCancel) onChange(res.assets?.[0]?.uri);
  };

  return (
    <View>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={s.photo} />
      ) : (
        <Text style={{ color: theme.subtext, marginBottom: 8 }}>No photo added</Text>
      )}

      <View style={s.photoActions}>
        {/* <TouchableOpacity style={s.btnGhost} onPress={takePhoto}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="photo-camera" size={18} color={theme.blue} />
            <Text style={s.btnGhostText}>Take Photo</Text>
          </View>
        </TouchableOpacity> */}
        <TouchableOpacity style={s.btnGhost1} onPress={pickFromGallery}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="image" size={18} color={theme.blue} />
            <Text style={s.btnGhostText}>Choose</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
