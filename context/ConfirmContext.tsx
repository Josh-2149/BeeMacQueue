import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../lib/constants';

type ConfirmButtonStyle = 'default' | 'cancel' | 'destructive';
export type ConfirmOption = {
  label: string;
  style?: ConfirmButtonStyle;
};

type ConfirmOptions = {
  title: string;
  message?: string;
  options?: ConfirmOption[];
};

type ConfirmContextType = {
  showConfirm: (options: ConfirmOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<ConfirmContextType>({
  showConfirm: async () => null,
});

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const [promiseResolver, setPromiseResolver] = useState<((value: string | null) => void) | null>(null);
  const [visible, setVisible] = useState(false);
  const translateY = React.useRef(new Animated.Value(300)).current;

  const showConfirm = useCallback((options: ConfirmOptions) => {
    return new Promise<string | null>((resolve) => {
      setDialog({
        title: options.title,
        message: options.message,
        options: options.options?.length ? options.options : [
          { label: 'Cancel', style: 'cancel' },
          { label: 'OK', style: 'default' },
        ],
      });
      setPromiseResolver(() => resolve);
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!visible) return;

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 8,
    }).start();
  }, [visible, translateY]);

  const handleSelect = (label: string) => {
    if (promiseResolver) promiseResolver(label);
    Animated.timing(translateY, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDialog(null);
      setPromiseResolver(null);
      setVisible(false);
      translateY.setValue(300);
    });
  };

  const handleClose = () => {
    if (promiseResolver) promiseResolver(null);
    Animated.timing(translateY, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDialog(null);
      setPromiseResolver(null);
      setVisible(false);
      translateY.setValue(300);
    });
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
          <Animated.View style={[styles.dialog, { transform: [{ translateY }] }]}>
            <Text style={styles.title}>{dialog?.title}</Text>
            <View style={styles.actions}>
              {dialog?.options?.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.button,
                    option.style === 'destructive' && styles.destructiveButton,
                    option.style === 'cancel' && option.label === 'Cancel' && styles.cancelOutlineButton,
                    option.style === 'cancel' && option.label !== 'Cancel' && styles.cancelButton,
                    option.style === 'default' && option.label === 'Confirm' && styles.confirmButton,
                    option.style === 'default' && option.label !== 'Confirm' && styles.defaultButton,
                  ]}
                  onPress={() => handleSelect(option.label)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      option.style === 'destructive' && styles.destructiveText,
                      option.style === 'cancel' && option.label === 'Cancel' && styles.cancelOutlineText,
                      option.style === 'cancel' && option.label !== 'Cancel' && styles.cancelText,
                      option.style === 'default' && option.label === 'Confirm' && styles.confirmText,
                      option.style === 'default' && option.label !== 'Confirm' && styles.defaultText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dialog: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    gap: 8,
  },
  button: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: COLORS.gray100,
  },
  cancelOutlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  destructiveButton: {
    backgroundColor: '#FEE2E2',
  },
  defaultButton: {
    backgroundColor: COLORS.red,
  },
  confirmButton: {
    backgroundColor: COLORS.green,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  destructiveText: {
    color: '#B91C1C',
  },
  cancelText: {
    color: COLORS.gray700,
  },
  cancelOutlineText: {
    color: COLORS.red,
  },
  defaultText: {
    color: COLORS.white,
  },
  confirmText: {
    color: COLORS.white,
  },
});
