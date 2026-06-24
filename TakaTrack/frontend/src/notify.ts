let configured = false;

function getModule(): any {
  try {
    const name = 'expo-notifications';
    return require(name);
  } catch {
    return null;
  }
}

export async function setupNotifications(): Promise<void> {
  const N = getModule();
  if (!N) return;
  try {
    if (!configured && typeof N.setNotificationHandler === 'function') {
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
        }),
      });
      configured = true;
    }
    const current = await N.getPermissionsAsync();
    if (!current.granted) await N.requestPermissionsAsync();
  } catch {}
}

export async function notifyTransaction(title: string, body: string): Promise<void> {
  const N = getModule();
  if (!N || typeof N.scheduleNotificationAsync !== 'function') return;
  try {
    await N.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {}
}
