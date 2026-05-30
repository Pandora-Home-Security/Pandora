import { useState, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '../contexts/ThemeContext';
import type { ColorPalette } from '../theme/colors';
import { AppHeader } from './AppHeader';
import { DrawerMenu } from './DrawerMenu';

type Props = {
  title: string;
  children: ReactNode;
};

export function AppScreenLayout({ title, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.root}>
      <AppHeader title={title} onMenuPress={() => setDrawerOpen(true)} />
      <View style={styles.content}>{children}</View>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bgDeep,
    },
    content: {
      flex: 1,
    },
  });
