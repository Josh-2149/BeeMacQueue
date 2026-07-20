import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export type ToastOptions = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextType = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

interface ToastItem extends ToastOptions {
  id: string;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = {
      id,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 2000,
    };

    setToasts([toast]);

    setTimeout(() => removeToast(id), toast.duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.wrapper}>
        {children}
        <View pointerEvents="box-none" style={styles.container}>
          {toasts.map((toast) => (
            <ToastMessage
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const translateX = new Animated.Value(-200);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    const enterAnimation = Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]);

    const exitAnimation = Animated.parallel([
      Animated.timing(translateX, { toValue: -200, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);

    enterAnimation.start();

    const timer = setTimeout(() => {
      exitAnimation.start(({ finished }) => {
        if (finished) {
          onDismiss();
        }
      });
    }, toast.duration ?? 2000);

    return () => clearTimeout(timer);
  }, [onDismiss, opacity, toast.duration, translateX]);

  const backgroundColor = {
    success: '#166534',
    error: '#991B1B',
    info: '#1D4ED8',
    warning: '#C9960A',
  }[toast.variant ?? 'info'];

  const iconName = {
    success: 'check-circle',
    error: 'x-circle',
    info: 'info',
    warning: 'alert-circle',
  }[toast.variant ?? 'info'];
  const textColor = '#FFFFFF';

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor, transform: [{ translateX }], opacity },
      ]}
    >
      <View style={styles.toastContent}>
        <Feather name={iconName} size={18} color={textColor} style={styles.icon} />
        <Text style={[styles.message, { color: textColor }]} numberOfLines={1}>
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 'auto',
    zIndex: 999,
    alignItems: 'flex-start',
  },
  toast: {
    width: 'auto',
    maxWidth: '75%',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 0,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  icon: {
    marginRight: 10,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flexShrink: 1,
  },
});
