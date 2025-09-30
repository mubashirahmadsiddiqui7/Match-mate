import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { getAuthToken, BASE_URL, join } from '../../services/https';
import PALETTE from '../../theme/palette';

type PDFViewerRouteProp = RouteProp<ExporterStackParamList, 'PDFViewer'>;
type PDFViewerNavigationProp = NativeStackNavigationProp<
  ExporterStackParamList,
  'PDFViewer'
>;

interface Props {
  route: PDFViewerRouteProp;
  navigation: PDFViewerNavigationProp;
}

export default function PDFViewer({ route, navigation }: Props) {
  const { recordId } = route.params;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadPDF = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const apiUrl = join(BASE_URL, `traceability-records/${recordId}/generate-document`);

      console.log('🔗 PDF API Request:', {
        url: apiUrl,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      console.log('📊 PDF API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('📄 PDF Response Data:', responseData);

      if (responseData.success && responseData.download_url) {
        console.log('✅ PDF Download URL received:', responseData.download_url);
        setPdfUrl(responseData.download_url);
      } else {
        throw new Error('Invalid response: missing download_url');
      }
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load PDF',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    console.log('🚀 PDFViewer mounted with recordId:', recordId);
    loadPDF();
  }, [recordId, loadPDF]);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        console.log('Android version:', androidVersion);

        if (androidVersion >= 33) {
          // For Android 13+, we can use app's internal storage without permission
          // Downloads folder requires special permission or we use app storage
          return true;
        } else {
          // For older Android versions, request WRITE_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to storage to download PDF files.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Storage permission is required to download PDF',
          position: 'top',
        });
        return;
      }

      if (!pdfUrl) {
        throw new Error('No PDF URL available for download');
      }

      console.log('📥 Downloading PDF from URL:', pdfUrl);

      // Download PDF from the provided URL
      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const pdfBlob = await response.blob();
      console.log('📄 PDF Blob downloaded:', {
        size: pdfBlob.size,
        type: pdfBlob.type,
      });

      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const base64PDF = base64Data.split(',')[1]; // Remove data:application/pdf;base64, prefix

          // Determine file path - try multiple locations for better compatibility
          const fileName = `traceability-record-${recordId}.pdf`;
          let filePath = '';
          let success = false;

          // Try different directories in order of preference
          // Prioritize app storage over Downloads folder to avoid permission issues
          const possiblePaths = [
            `${RNFS.DocumentDirectoryPath}/${fileName}`, // App's document directory (most reliable)
            `${RNFS.CachesDirectoryPath}/${fileName}`, // App's cache directory
            Platform.OS === 'android'
              ? `${RNFS.DownloadDirectoryPath}/${fileName}`
              : null, // Downloads (Android only)
          ].filter((path): path is string => path !== null);

          for (const path of possiblePaths) {
            try {
              // Ensure directory exists
              const dirPath = path.substring(0, path.lastIndexOf('/'));
              const dirExists = await RNFS.exists(dirPath);
              if (!dirExists) {
                await RNFS.mkdir(dirPath);
              }

              await RNFS.writeFile(path, base64PDF, 'base64');
              filePath = path;
              success = true;
              break;
            } catch (error) {
              console.warn(`Failed to write to ${path}:`, error);
              continue;
            }
          }

          if (!success) {
            throw new Error('Failed to save PDF to any available directory');
          }

          // Determine user-friendly location message
          let locationMessage = '';
          if (filePath.includes('DocumentDirectoryPath')) {
            locationMessage = 'App Documents folder';
          } else if (filePath.includes('CachesDirectoryPath')) {
            locationMessage = 'App Cache folder';
          } else if (filePath.includes('DownloadDirectoryPath')) {
            locationMessage = 'Downloads folder';
          } else {
            locationMessage = 'Device storage';
          }

          Toast.show({
            type: 'success',
            text1: 'Download Complete! 🎉',
            text2: `PDF saved to ${locationMessage}`,
            position: 'top',
            visibilityTime: 4000,
          });

          Alert.alert(
            'Download Complete',
            `PDF document has been successfully saved!\n\n📁 Location: ${locationMessage}\n📄 File: ${fileName}\n📊 Size: ${(pdfBlob.size / 1024).toFixed(1)} KB`,
            [
              {
                text: 'Open PDF',
                onPress: async () => {
                  try {
                    await FileViewer.open(filePath, {
                      showOpenWithDialog: true,
                      showAppsSuggestions: true,
                    });
                  } catch (error) {
                    console.error('Error opening PDF:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'Open Failed',
                      text2: 'No app available to open PDF files',
                      position: 'top',
                    });
                  }
                },
              },
              {
                text: 'Share PDF',
                onPress: async () => {
                  try {
                    // Convert file path to proper URI format
                    const fileUri = Platform.OS === 'android' 
                      ? `file://${filePath}` 
                      : `file://${filePath}`;
                    
                    console.log('Sharing PDF with URI:', fileUri);
                    
                    const shareOptions = {
                      title: `Traceability Record - ${recordId}`,
                      message: `Traceability Record PDF: ${recordId}`,
                      url: fileUri,
                      type: 'application/pdf',
                      subject: `Traceability Record - ${recordId}`,
                    };
                    await Share.open(shareOptions);
                  } catch (error) {
                    console.error('Error sharing PDF:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'Share Failed',
                      text2: 'Unable to share PDF file. Please try opening the file directly.',
                      position: 'top',
                    });
                  }
                },
              },
              {
                text: 'OK',
                style: 'default',
              },
            ]
          );
        } catch (error: any) {
          console.error('Error saving PDF:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Failed to save PDF',
            position: 'top',
          });
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to convert PDF to base64');
      };

      reader.readAsDataURL(pdfBlob);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to download PDF',
        position: 'top',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>PDF Viewer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      </View>
    );
  }

  if (!pdfUrl) {
    console.log('❌ No PDF URL available, showing error state');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>PDF Viewer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={PALETTE.text500} />
          <Text style={styles.errorTitle}>Failed to Load PDF</Text>
          <Text style={styles.errorMessage}>
            Unable to load the PDF document. Please try again.
          </Text>
          <Pressable onPress={loadPDF} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  console.log('📱 Rendering WebView with PDF URL:', {
    pdfUrlLength: pdfUrl.length,
    pdfUrlPreview: pdfUrl.substring(0, 50) + '...',
    isDataUrl: pdfUrl.startsWith('data:'),
    mimeType: pdfUrl.split(',')[0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Traceability Record PDF</Text>
        <Pressable
          onPress={handleDownloadPDF}
          style={[
            styles.downloadButton,
            downloading && styles.downloadButtonDisabled,
          ]}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="download" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onError={error => {
            console.error('❌ WebView error:', error);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to load PDF in viewer',
              position: 'top',
            });
          }}
          onLoadStart={() => {
            console.log('🔄 WebView loading started');
            setLoading(true);
          }}
          onLoadEnd={() => {
            console.log('✅ WebView loading completed');
            setLoading(false);
          }}
          onMessage={event => {
            console.log('📨 WebView message:', event.nativeEvent.data);
          }}
          onHttpError={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView HTTP error:', nativeEvent);
          }}
          onRenderProcessGone={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView render process gone:', nativeEvent);
          }}
        />
      </View>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.text600,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text700,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: PALETTE.text500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
