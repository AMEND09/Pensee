import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Font } from '../../constants/theme';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Font.serif, fontSize: 24, color: Colors.textPrimary },
});

