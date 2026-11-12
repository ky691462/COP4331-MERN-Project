import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Alert, Btn, H1, Screen, T } from '@/components/ui';
import { codeFromScan } from '@/lib/api';
import { useApp } from '@/lib/app-context';

// Scan the QR code on the host's screen (website or app) to fill in the room code.
export default function ScanScreen() {
  const { colors } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState('');
  const done = useRef(false);

  function onScanned({ data }: { data: string }) {
    if (done.current) return;
    const code = codeFromScan(data);
    if (!code) {
      setError("That QR code isn't an Impostor room.");
      return;
    }
    done.current = true;
    router.replace({ pathname: '/home', params: { join: code } });
  }

  return (
    <Screen>
      <H1 onStage>Scan to join</H1>
      <T size={17} color={colors.onStageSoft} style={{ marginBottom: 18 }}>
        Point your camera at the room QR code on the host’s screen.
      </T>

      {!permission ? null : !permission.granted ? (
        <View style={{ backgroundColor: colors.paper, borderRadius: 20, padding: 22, gap: 14 }}>
          <T>Impostor needs the camera to read room codes. Nothing is recorded.</T>
          <Btn label="Allow camera" onPress={requestPermission} />
        </View>
      ) : (
        <View style={[styles.frame, { borderColor: colors.line }]}>
          <CameraView style={StyleSheet.absoluteFill} facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned} />
        </View>
      )}

      {!!error && <View style={{ marginTop: 16 }}><Alert kind="error">{error}</Alert></View>}
      <Btn kind="secondary" label="Type the code instead" onPress={() => router.back()} style={{ marginTop: 18 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 1, borderRadius: 22, borderWidth: 3, overflow: 'hidden', backgroundColor: '#000' },
});
