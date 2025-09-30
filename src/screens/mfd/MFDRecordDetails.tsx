/* eslint-disable react-native/no-inline-styles */
// src/screens/mfd/MFDRecordDetails.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StatusBar,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import {
  fetchTraceabilityRecordById,
  type TraceabilityRecord,
  approveTraceabilityRecord,
  rejectTraceabilityRecord,
} from '../../services/traceability';
import { getAuthToken, BASE_URL, join } from '../../services/https';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import PALETTE from '../../theme/palette';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

/* ---------- constants ---------- */
const PRIMARY = PALETTE.green700;

/* ---------- main component ---------- */
export default function MFDRecordDetails() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<MFDStackParamList, 'RecordDetails'>>();

  const [record, setRecord] = useState<TraceabilityRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTraceabilityRecordById(params.recordId);
      setRecord(data);
    } catch (error) {
      console.error('Error loading record:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load record details',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [params.recordId]);

  useEffect(() => {
    load();
  }, [load]);

  // refresh whenever screen regains focus (after actions)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

  const handleApprove = async () => {
    if (!record) return;
    
    try {
      Alert.alert(
        'Approve Record',
        `Are you sure you want to approve record ${record.document_no}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            style: 'default',
            onPress: async () => {
              try {
                await approveTraceabilityRecord(record.id);
                Toast.show({
                  type: 'success',
                  text1: 'Record Approved',
                  text2: `Record ${record.document_no} has been approved successfully`,
                  position: 'top',
                });
                load(); // Refresh the record data
              } catch (error) {
                console.error('Error approving record:', error);
                Toast.show({
                  type: 'error',
                  text1: 'Approval Failed',
                  text2: 'Failed to approve record. Please try again.',
                  position: 'top',
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in approve handler:', error);
    }
  };

  const handleReject = async () => {
    if (!record) return;
    
    try {
      Alert.alert(
        'Reject Record',
        `Are you sure you want to reject record ${record.document_no}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              try {
                await rejectTraceabilityRecord(record.id);
                Toast.show({
                  type: 'success',
                  text1: 'Record Rejected',
                  text2: `Record ${record.document_no} has been rejected`,
                  position: 'top',
                });
                load(); // Refresh the record data
              } catch (error) {
                console.error('Error rejecting record:', error);
                Toast.show({
                  type: 'error',
                  text1: 'Rejection Failed',
                  text2: 'Failed to reject record. Please try again.',
                  position: 'top',
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in reject handler:', error);
    }
  };

  const handleGenerateDocument = async () => {
    if (!record) return;
    
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 16, color: PALETTE.text600 }}>Loading record details...</Text>
      </SafeAreaView>
    );
  }
  if (!record) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Back to Records"
        >
          <MaterialIcons name="arrow-back" size={20} color="white" />
          <Text style={styles.backButtonText}>Back to Records</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>Traceability Record Details</Text>
        <Text style={styles.breadcrumb}>Traceability Record • Document No: {record.document_no}</Text>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Document Header */}
          <View style={styles.documentHeader}>
            <View style={styles.documentInfo}>
              <MaterialIcons name="description" size={24} color="#333" />
              <Text style={styles.documentTitle}>
                Traceability Record Document No: {record.document_no}
              </Text>
            </View>
            <Text style={styles.statusText}>{record.status_label || record.status?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>

          {/* Document Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Information</Text>
            <View style={styles.infoGrid}>
              <InfoRow label="Document No" value={record.document_no} />
              <InfoRow label="Manual ID" value={record.mfd_manual_id || 'N/A'} />
              <InfoRow label="Document Date" value={record.document_date ? new Date(record.document_date).toLocaleString() : 'N/A'} />
              <InfoRow label="Date of Shipment" value={record.date_of_shipment ? new Date(record.date_of_shipment).toLocaleString() : 'N/A'} />
              <InfoRow label="Invoice No" value={record.invoice_no || 'N/A'} />
              <InfoRow label="Export Certificate No" value={record.export_certificate_no || 'N/A'} />
              <InfoRow label="Consignee Name" value={record.consignee_name || 'N/A'} />
              <InfoRow label="Consignee Country" value={record.consignee_country || 'N/A'} />
            </View>
          </View>

          {/* Company Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <View style={styles.infoGrid}>
              <InfoRow label="Exporter" value={record.exporter_name || 'N/A'} />
              <InfoRow label="Company" value={record.company?.name || record.exporter_name || 'N/A'} />
              <InfoRow label="Plant Address" value={record.plant_address || 'N/A'} />
              <InfoRow label="Validating Authority" value={record.validating_authority || 'N/A'} />
              <InfoRow label="Final Weight" value={`${record.total_quantity_kg || '0.00'} KG`} />
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={[styles.statusPill, { backgroundColor: record.status === 'approved' ? '#4caf50' : '#ff9800' }]}>
                  <Text style={styles.statusPillText}>{record.status_label || record.status?.toUpperCase() || 'UNKNOWN'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Selected Lots Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Lots ({record.selected_lots?.length || 0})</Text>
            {record.selected_lots && record.selected_lots.length > 0 ? (
              <View style={styles.lotsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Lot No</Text>
                  <Text style={styles.tableHeaderText}>Final Product Name</Text>
                  <Text style={styles.tableHeaderText}>Quantity (KG)</Text>
                </View>
                {record.selected_lots.map((lot, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{lot.lot_no}</Text>
                    <Text style={styles.tableCell}>{lot.final_product_name}</Text>
                    <Text style={styles.tableCell}>{lot.quantity_kg}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No lots selected</Text>
            )}
          </View>

          {/* Approval Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval Information</Text>
            <View style={styles.infoGrid}>
              <InfoRow label="Approved By" value={record.approver?.name || 'N/A'} />
              <InfoRow label="Approved At" value={record.approved_at ? new Date(record.approved_at).toLocaleString() : 'N/A'} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backToRecordsButton}
            >
              <MaterialIcons name="arrow-back" size={16} color="white" />
              <Text style={styles.backToRecordsText}>Back</Text>
            </Pressable>
            
            {record.status?.toLowerCase().includes('pending') ? (
              <>
                <Pressable
                  onPress={handleApprove}
                  style={styles.approveButton}
                >
                  <MaterialIcons name="check-circle" size={16} color="#fff" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </Pressable>
                <Pressable
                  onPress={handleReject}
                  style={styles.rejectButton}
                >
                  <MaterialIcons name="cancel" size={16} color="#fff" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </Pressable>
              </>
            ) : record.status?.toLowerCase().includes('approved') ? (
              <Pressable
                onPress={handleGenerateDocument}
                style={styles.generateButton}
              >
                <MaterialIcons name="picture-as-pdf" size={16} color="#fff" />
                <Text style={styles.generateButtonText}>Generate</Text>
              </Pressable>
            ) : record.status?.toLowerCase().includes('rejected') ? (
              <View style={styles.rejectedPlaceholder} />
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

/* ---------- presentational pieces ---------- */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    color: 'white',

  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  breadcrumb: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  lotsTable: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 8,
    marginTop: 4,
  },
  backToRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#6b7280',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#4b5563',
    minHeight: 44,
  },
  backToRecordsText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#6d28d9',
    minHeight: 44,
  },
  generateButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#047857',
    minHeight: 44,
  },
  approveButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b91c1c',
    minHeight: 44,
  },
  rejectButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  rejectedPlaceholder: {
    flex: 1,
  },
});