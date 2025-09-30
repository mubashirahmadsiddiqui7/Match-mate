import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { TraceabilityRecord } from '../../services/traceability';
import { getAuthToken, BASE_URL, join } from '../../services/https';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

type ViewRecordRouteProp = RouteProp<ExporterStackParamList, 'ViewRecord'>;
type ViewRecordNavigationProp = NativeStackNavigationProp<ExporterStackParamList, 'ViewRecord'>;

export default function ViewRecord() {
  const navigation = useNavigation<ViewRecordNavigationProp>();
  const route = useRoute<ViewRecordRouteProp>();
  const { record } = route.params;
  
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        console.log('Android version:', androidVersion);

        if (androidVersion >= 33) {
          // For Android 13+, we can use app's internal storage without permission
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
            }
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

  const handleGenerateDocument = async () => {
    try {
      // Show loading toast with progress
      Toast.show({
        type: 'info',
        text1: 'Generating Document',
        text2: `Creating PDF for ${record.document_no}...`,
        position: 'top',
        visibilityTime: 3000,
      });

      // Request storage permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Storage permission is needed to download PDF files.',
          position: 'top',
        });
        return;
      }

      // Step 1: Generate document and get download URL
      Toast.show({
        type: 'info',
        text1: 'Step 1/3',
        text2: 'Requesting document generation...',
        position: 'top',
        visibilityTime: 2000,
      });

      const response = await fetch(join(BASE_URL, `traceability-records/${record.id}/generate-document`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      console.log('📄 PDF Response Data:', responseData);

      if (!responseData.success || !responseData.download_url) {
        throw new Error('Invalid response: Document generation failed or no download URL provided');
      }

      console.log('✅ PDF Download URL received:', responseData.download_url);

      // Step 2: Download PDF
      Toast.show({
        type: 'info',
        text1: 'Step 2/3',
        text2: 'Downloading PDF file...',
        position: 'top',
        visibilityTime: 2000,
      });

      const pdfResponse = await fetch(responseData.download_url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          'User-Agent': 'MFD-TraceFish-Mobile/1.0',
        },
      });

      if (!pdfResponse.ok) {
        throw new Error(`Download failed (${pdfResponse.status}): Unable to download PDF from server`);
      }

      // Check content type
      const contentType = pdfResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('pdf')) {
        console.warn('⚠️ Unexpected content type:', contentType);
      }

      // Get the PDF blob
      const pdfBlob = await pdfResponse.blob();
      console.log('📦 PDF Blob size:', pdfBlob.size, 'bytes');

      if (pdfBlob.size === 0) {
        throw new Error('Downloaded PDF file is empty');
      }

      // Step 3: Save to device
      Toast.show({
        type: 'info',
        text1: 'Step 3/3',
        text2: 'Saving to device...',
        position: 'top',
        visibilityTime: 2000,
      });

      // Convert blob to base64
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const base64PDF = base64Data.split(',')[1]; // Remove data:application/pdf;base64, prefix
          
          // Create filename with timestamp for uniqueness
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `traceability-${record.document_no}-${timestamp}.pdf`;
          
          // Try multiple directories for better compatibility
          // Prioritize app storage over Downloads folder to avoid permission issues
          const possiblePaths = [
            `${RNFS.DocumentDirectoryPath}/${fileName}`, // App's document directory (most reliable)
            `${RNFS.CachesDirectoryPath}/${fileName}`,   // App's cache directory
            `${RNFS.DownloadDirectoryPath}/${fileName}`, // Downloads folder (may require special permissions)
          ].filter(Boolean);

          let filePath = '';
          let success = false;
          let locationMessage = '';

          for (const path of possiblePaths) {
            if (!path) continue;
            
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
              
              // Determine location message
              if (path.includes('DownloadDirectoryPath')) {
                locationMessage = 'Downloads folder';
              } else if (path.includes('DocumentDirectoryPath')) {
                locationMessage = 'App Documents folder';
              } else if (path.includes('CachesDirectoryPath')) {
                locationMessage = 'App Cache folder';
              }
              
              break;
            } catch (error) {
              console.warn(`Failed to write to ${path}:`, error);
              continue;
            }
          }

          if (!success) {
            throw new Error('Failed to save PDF to any available directory. Please check storage permissions.');
          }
          
          console.log('✅ PDF saved successfully to:', filePath);
          
          // Success notification
          Toast.show({
            type: 'success',
            text1: 'Download Complete! 🎉',
            text2: `PDF saved to ${locationMessage}`,
            position: 'top',
            visibilityTime: 4000,
          });
          
          // Show detailed success alert with action options
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
                      title: `Traceability Record - ${record.document_no}`,
                      message: `Traceability Record PDF: ${record.document_no}`,
                      url: fileUri,
                      type: 'application/pdf',
                      subject: `Traceability Record - ${record.document_no}`,
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
          
        } catch (writeError: any) {
          console.error('❌ Error saving PDF:', writeError);
          Toast.show({
            type: 'error',
            text1: 'Save Failed',
            text2: `Failed to save PDF: ${writeError?.message || 'Unknown error'}`,
            position: 'top',
          });
        }
      };
      
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        Toast.show({
          type: 'error',
          text1: 'Conversion Failed',
          text2: 'Failed to process PDF data for saving.',
          position: 'top',
        });
      };
      
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('❌ Error generating document:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to generate document. Please try again.';
      const errorMsg = (error as Error).message || '';
      if (errorMsg.includes('Server error')) {
        errorMessage = 'Server error occurred. Please check your connection and try again.';
      } else if (errorMsg.includes('Download failed')) {
        errorMessage = 'Failed to download PDF. The file may be temporarily unavailable.';
      } else if (errorMsg.includes('empty')) {
        errorMessage = 'The generated PDF file is empty. Please contact support.';
      } else if (errorMsg.includes('permission')) {
        errorMessage = 'Storage permission denied. Please enable storage access in settings.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 5000,
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return '#757575';
    switch (status.toLowerCase()) {
      case 'approved': return '#2e7d32';
      case 'pending': return '#f57c00';
      case 'rejected': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getStatusBgColor = (status: string | null | undefined) => {
    if (!status) return '#F5F5F5';
    switch (status.toLowerCase()) {
      case 'approved': return '#E8F5E9';
      case 'pending': return '#FFF3E0';
      case 'rejected': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={24} color={PALETTE.text900} />
        </Pressable>
        <Text style={styles.headerTitle}>Record Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Header */}
        <View style={styles.card}>
          <View style={styles.documentHeader}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentNumber}>{record.document_no}</Text>
              <Text style={styles.mfdId}>MFD ID: {record.mfd_manual_id || 'N/A'}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: getStatusBgColor(record.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                {record.status_label}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.fieldGrid}>
            <Field label="Exporter" value={record.exporter_name} />
            <Field label="Company" value={record.company?.company_name || 'N/A'} />
            <Field label="Invoice No" value={record.invoice_no} />
            <Field label="Export Certificate No" value={record.export_certificate_no} />
            <Field label="Document Date" value={formatDate(record.document_date)} />
            <Field label="Shipment Date" value={formatDate(record.date_of_shipment)} />
          </View>
        </View>

        {/* Consignee Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consignee Information</Text>
          <View style={styles.fieldGrid}>
            <Field label="Consignee Name" value={record.consignee_name} />
            <Field label="Consignee Country" value={record.consignee_country} />
          </View>
        </View>

        {/* Plant Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Plant Information</Text>
          <View style={styles.fieldGrid}>
            <Field label="Plant Address" value={record.plant_address} />
            <Field label="Validating Authority" value={record.validating_authority} />
          </View>
        </View>

        {/* Quantities & Values */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quantities & Values</Text>
          <View style={styles.fieldGrid}>
            <Field label="Total Quantity (KG)" value={`${record.total_quantity_kg} KG`} />
            <Field label="Total Value" value={`$${record.total_value}`} />
          </View>
        </View>

        {/* Selected Lots */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Lots</Text>
          {record.selected_lots && record.selected_lots.length > 0 ? (
            <View style={styles.lotsContainer}>
              {record.selected_lots.map((lot, index) => (
                <View key={index} style={styles.lotItem}>
                  <View style={styles.lotHeader}>
                    <Text style={styles.lotNumber}>{lot.lot_no}</Text>
                    <Text style={styles.lotQuantity}>{lot.quantity} KG</Text>
                  </View>
                  <Text style={styles.lotProduct}>{lot.final_product_name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noData}>No lots selected</Text>
          )}
        </View>

        {/* Approval Information */}
        {(record.status === 'approved' || record.status === 'rejected') && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Approval Information</Text>
            <View style={styles.fieldGrid}>
              <Field label="Approved By" value={record.approver?.name || 'N/A'} />
              <Field label="Approved At" value={record.approved_at ? formatDate(record.approved_at) : 'N/A'} />
              {record.approval_notes && (
                <Field label="Approval Notes" value={record.approval_notes} />
              )}
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timestamps</Text>
          <View style={styles.fieldGrid}>
            <Field label="Created At" value={formatDate(record.created_at)} />
            <Field label="Updated At" value={formatDate(record.updated_at)} />
          </View>
        </View>

        {/* Action Buttons */}
        {!record.status?.toLowerCase().includes('pending') && (
          <View style={styles.actionsContainer}>
            <Pressable 
              onPress={handleGenerateDocument} 
              style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.8 }]}
            >
              <Icon name="description" size={20} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Document</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      <Toast />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentInfo: {
    flex: 1,
  },
  documentNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.green700,
    marginBottom: 4,
  },
  mfdId: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text900,
    marginBottom: 12,
  },
  fieldGrid: {
    gap: 12,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '600',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: PALETTE.text900,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  lotsContainer: {
    gap: 8,
  },
  lotItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lotNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.green700,
  },
  lotQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
  },
  lotProduct: {
    fontSize: 13,
    color: PALETTE.text600,
  },
  noData: {
    fontSize: 14,
    color: PALETTE.text500,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsContainer: {
    marginTop: 8,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.green700,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
});
