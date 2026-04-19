import { useState, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { AppHeader } from './AppHeader';
import { DrawerMenu } from './DrawerMenu';

type Props = {
  title: string;
  children: ReactNode;
};

export function AppScreenLayout({ title, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.root}>
      <AppHeader title={title} onMenuPress={() => setDrawerOpen(true)} />
      <View style={styles.content}>{children}</View>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  content: {
    flex: 1,
  },
});
