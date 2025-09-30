import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { type TraceabilityRecord, fetchTraceabilityRecords, approveTraceabilityRecord, rejectTraceabilityRecord } from '../../services/traceability';
import { getAuthToken, BASE_URL, join } from '../../services/https';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import Toast from 'react-native-toast-message';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

const getTypeColor = (record: TraceabilityRecord) => {
  // Use status-based colors for traceability records
  switch (record.status) {
    case 'approved': return '#10b981'; // Modern green
    case 'pending': return '#f59e0b'; // Modern amber
    case 'rejected': return '#ef4444'; // Modern red
    default: return '#6b7280'; // Modern gray
  }
};

const getStatusBgColor = (record: TraceabilityRecord) => {
  switch (record.status) {
    case 'approved': return '#d1fae5'; // Light green
    case 'pending': return '#fef3c7'; // Light amber
    case 'rejected': return '#fee2e2'; // Light red
    default: return '#f3f4f6'; // Light gray
  }
};

const RecordCard = ({ record, onRecordPress, onGenerateDocument, onApprove, onReject }: { 
  record: TraceabilityRecord; 
  onRecordPress: (record: TraceabilityRecord) => void;
  onGenerateDocument: (record: TraceabilityRecord) => void;
  onApprove: (record: TraceabilityRecord) => void;
  onReject: (record: TraceabilityRecord) => void;
}) => {
  const isPending = record.status?.toLowerCase().includes('pending');
  const isApproved = record.status?.toLowerCase().includes('approved');
  const isRejected = record.status?.toLowerCase().includes('rejected');
  
  return (
    <View style={styles.recordCard}>
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentId}>{record.document_no}</Text>
          <Text style={styles.mfdId}>MFD ID: {record.mfd_manual_id || 'N/A'}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusBgColor(record) }]}>
          <Text style={[styles.statusText, { color: getTypeColor(record) }]}>
            {record.status_label || record.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
      </View>

      {/* Information Rows */}
      <View style={styles.infoSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Exporter</Text>
          <Text style={styles.detailValue}>{record.exporter_name || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Invoice No</Text>
          <Text style={styles.detailValue}>{record.invoice_no || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Consignee</Text>
          <Text style={styles.detailValue}>{record.consignee_name || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Consignee Country</Text>
          <Text style={styles.detailValue}>{record.consignee_country || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity (KG)</Text>
          <Text style={styles.detailValue}>{record.total_quantity_kg || '0.00'} KG</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {record.document_date 
              ? new Date(record.document_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })
              : '—'
            }
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable 
          onPress={() => onRecordPress(record)} 
          style={({ pressed }) => [styles.viewButton, pressed && { opacity: 0.8 }]}
        >
          <Icon name="visibility" size={16} color="#fff" />
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>
        
        {isPending ? (
          <>
            <Pressable 
              onPress={() => onApprove(record)} 
              style={({ pressed }) => [styles.approveButton, pressed && { opacity: 0.8 }]}
            >
              <Icon name="check-circle" size={16} color="#fff" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </Pressable>
            <Pressable 
              onPress={() => onReject(record)} 
              style={({ pressed }) => [styles.rejectButton, pressed && { opacity: 0.8 }]}
            >
              <Icon name="cancel" size={16} color="#fff" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </Pressable>
          </>
        ) : isApproved ? (
            <Pressable 
              onPress={() => onGenerateDocument(record)} 
              style={({ pressed }) => [styles.generateButton, pressed && { opacity: 0.8 }]}
            >
              <Icon name="description" size={16} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
            </Pressable>
        ) : isRejected ? (
          <View style={styles.rejectedPlaceholder} />
        ) : null}
      </View>
    </View>
  );
};

const FilterChip = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
  <Pressable 
    onPress={onPress}
    style={[styles.filterChip, isActive && styles.filterChipActive]}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Icon name="description" size={64} color={PALETTE.text400} />
    <Text style={styles.emptyTitle}>No records found</Text>
    <Text style={styles.emptyMessage}>
      There are no traceability records available at the moment.
    </Text>
  </View>
);

export default function MFDRecordsList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<TraceabilityRecord[]>([]);
  const [filter, setFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTraceabilityRecords({ status: filter === 'All' ? undefined : filter.toLowerCase() });
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading records:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load records',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }, [loadRecords]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRecordPress = (record: TraceabilityRecord) => {
    navigation.navigate('RecordDetails', { recordId: record.id });
  };

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

  const handleApprove = async (record: TraceabilityRecord) => {
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
                loadRecords(); // Refresh the list
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

  const handleReject = async (record: TraceabilityRecord) => {
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
                loadRecords(); // Refresh the list
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

  const handleGenerateDocument = async (record: TraceabilityRecord) => {
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

  const filteredRecords = records;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>MFD Records</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All', 'Approved', 'Pending', 'Rejected'] as const).map((status) => (
            <FilterChip
              key={status}
              label={status}
              isActive={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>
      </View>

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RecordCard 
            record={item} 
            onRecordPress={handleRecordPress}
            onGenerateDocument={handleGenerateDocument}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyState}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    backgroundColor:'#145A1F',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 44,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#145A1F',
    borderColor: '#047857',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#145A1F',
    marginBottom: 4,
  },
  mfdId: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  viewButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    minHeight: 44,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
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
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    textAlign: 'center',
  },
  approveButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
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
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
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
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    textAlign: 'center',
  },
  rejectedPlaceholder: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
