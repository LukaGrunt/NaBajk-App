/**
 * overlayExport – thin wrapper around react-native-view-shot capture.
 *
 * Callers pass the ViewShot ref; this module calls capture() and returns the
 * resulting file:// URI (or null on failure).  Keeping capture logic isolated
 * lets screens stay declarative.
 */

export async function exportOverlayToPng(ref: { current: any }): Promise<string | null> {
  if (!ref.current) return null;
  try {
    const uri: string = await ref.current.capture();
    return uri;
  } catch {
    return null;
  }
}
