import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MAX_WIDTH, spacing } from '../../constants/colors';

export function Screen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    gap: spacing.lg,
  },
});