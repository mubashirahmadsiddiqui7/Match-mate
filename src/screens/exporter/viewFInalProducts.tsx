import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import {
  fetchTraceabilityRecords,
  type TraceabilityRecord,
} from '../../services/traceability';
import { getAuthToken, BASE_URL, join } from '../../services/https';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

type Nav = NativeStackNavigationProp<ExporterStackParamList>;

function adapt(r: TraceabilityRecord) {
  return {
    id: String(r.id),
    doc: r.document_no,
    exporter: r.exporter_name || r.company?.name || '—',
    invoiceNo: r.invoice_no || '—',
    consignee: r.consignee_name || '—',
    country: r.consignee_country || '—',
    quantityKg: Number(r.total_quantity_kg || 0),
    date: new Date(r.document_date || r.created_at || '').toDateString(),
    status: (r.status_label || r.status || 'Pending') as
      | 'Approved'
      | 'Pending'
      | 'Rejected',
  };
}

const ListHeader = ({
  status,
  setStatus,
  handleBack,
  handleNewRecord,
}: {
  status: 'All' | 'Approved' | 'Pending' | 'Rejected';
  setStatus: (s: 'All' | 'Approved' | 'Pending' | 'Rejected') => void;
  handleBack: () => void;
  handleNewRecord: () => void;
}) => (
  <View>
    {/* App bar */}
    <View style={styles.appbar}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
      >
        <Icon name="arrow-back" size={22} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.appbarTitle}>Traceability Records</Text>
      <Pressable
        onPress={handleNewRecord}
        style={({ pressed }) => [
          styles.newRecordBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Icon name="add" size={22} color="#FFFFFF" />
      </Pressable>
    </View>

    {/* Filters (outside header) */}
    <View style={styles.headerPadding}>
      <View style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Status</Text>
        <View style={styles.chipsRow}>
          {(['All', 'Approved', 'Pending', 'Rejected'] as const).map(s => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              style={[styles.chip, status === s && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, status === s && styles.chipTextActive]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  </View>
);

const ItemSeparator = () => <View style={styles.itemSeparator} />;

const EmptyState = ({
  status,
  navigation,
}: {
  status: 'All' | 'Approved' | 'Pending' | 'Rejected';
  navigation: any;
}) => (
  <View style={styles.emptyState}>
    <Icon name="description" size={64} color={PALETTE.text500} />
    <Text style={styles.emptyTitle}>No Records Found</Text>
    <Text style={styles.emptyMessage}>
      {status === 'All'
        ? "You haven't created any traceability records yet. Create your first record to get started."
        : `No ${status.toLowerCase()} records found. Try changing the filter or create a new record.`}
    </Text>
    <Pressable
      onPress={() => navigation.navigate('traceabilityForm')}
      style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }]}
    >
      <Icon name="add" size={20} color="#fff" />
      <Text style={styles.createBtnText}>Create New Record</Text>
    </Pressable>
  </View>
);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const RecordItem = ({
  item,
  originalRecords,
  navigation,
  onGenerateDocument,
}: {
  item: ReturnType<typeof adapt>;
  originalRecords: TraceabilityRecord[];
  navigation: any;
  onGenerateDocument: (record: TraceabilityRecord) => void;
}) => (
  <View style={styles.recordCard}>
    <View style={styles.recordHeader}>
      <Text style={styles.doc}>{item.doc}</Text>
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
    <View style={styles.recordGrid}>
      <Field label="Exporter" value={item.exporter} />
      <Field label="Invoice No" value={item.invoiceNo} />
      <Field label="Consignee" value={item.consignee} />
      <Field label="Consignee Country" value={item.country} />
      <Field label="Quantity (KG)" value={`${item.quantityKg.toFixed(2)} KG`} />
      <Field label="Date" value={item.date} />
    </View>
    <View style={styles.actionsRow}>
      <Pressable
        onPress={() => {
          const originalRecord = originalRecords.find(
            r => String(r.id) === item.id,
          );
          if (originalRecord) {
            navigation.navigate('ViewRecord', { record: originalRecord });
          }
        }}
        style={({ pressed }) => [
          styles.outlineBtn,
          pressed && { opacity: 0.95 },
        ]}
      >
        <Icon name="visibility" size={16} color={PALETTE.text900} />
        <Text style={styles.outlineText}>View</Text>
      </Pressable>
      {!item.status.toLowerCase().includes('pending') && (
        <Pressable
          onPress={() => {
            const originalRecord = originalRecords.find(
              r => String(r.id) === item.id,
            );
            if (originalRecord) {
              onGenerateDocument(originalRecord);
            }
          }}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.95 },
          ]}
        >
          <Icon name="description" size={16} color="#fff" />
          <Text style={styles.secondaryText}>Generate Document</Text>
        </Pressable>
      )}
    </View>
  </View>
);

const ListHeaderWrapper = ({
  status,
  setStatus,
  handleBack,
  handleNewRecord,
}: {
  status: 'All' | 'Approved' | 'Pending' | 'Rejected';
  setStatus: (s: 'All' | 'Approved' | 'Pending' | 'Rejected') => void;
  handleBack: () => void;
  handleNewRecord: () => void;
}) => (
  <ListHeader
    status={status}
    setStatus={setStatus}
    handleBack={handleBack}
    handleNewRecord={handleNewRecord}
  />
);

const EmptyStateWrapper = ({
  status,
  navigation,
}: {
  status: 'All' | 'Approved' | 'Pending' | 'Rejected';
  navigation: any;
}) => <EmptyState status={status} navigation={navigation} />;

export default function ViewFinalProduct() {
  const navigation = useNavigation<Nav>();

  const handleBack = useCallback(() => {
    // @ts-ignore
    navigation.navigate('ExporterHome');
  }, [navigation]);

  const handleNewRecord = useCallback(() => {
    navigation.navigate('traceabilityForm');
  }, [navigation]);

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
              message:
                'This app needs access to storage to download PDF files.',
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

      const response = await fetch(
        join(BASE_URL, `traceability-records/${record.id}/generate-document`),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      console.log('📄 PDF Response Data:', responseData);

      if (!responseData.success || !responseData.download_url) {
        throw new Error(
          'Invalid response: Document generation failed or no download URL provided',
        );
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
          Accept: 'application/pdf',
          'User-Agent': 'MFD-TraceFish-Mobile/1.0',
        },
      });

      if (!pdfResponse.ok) {
        throw new Error(
          `Download failed (${pdfResponse.status}): Unable to download PDF from server`,
        );
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
            `${RNFS.CachesDirectoryPath}/${fileName}`, // App's cache directory
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
            throw new Error(
              'Failed to save PDF to any available directory. Please check storage permissions.',
            );
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
            `PDF document has been successfully saved!\n\n📁 Location: ${locationMessage}\n📄 File: ${fileName}\n📊 Size: ${(
              pdfBlob.size / 1024
            ).toFixed(1)} KB`,
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
            ],
          );
        } catch (writeError: any) {
          console.error('❌ Error saving PDF:', writeError);
          Toast.show({
            type: 'error',
            text1: 'Save Failed',
            text2: `Failed to save PDF: ${
              writeError?.message || 'Unknown error'
            }`,
            position: 'top',
          });
        }
      };

      reader.onerror = error => {
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
        errorMessage =
          'Server error occurred. Please check your connection and try again.';
      } else if (errorMsg.includes('Download failed')) {
        errorMessage =
          'Failed to download PDF. The file may be temporarily unavailable.';
      } else if (errorMsg.includes('empty')) {
        errorMessage =
          'The generated PDF file is empty. Please contact support.';
      } else if (errorMsg.includes('permission')) {
        errorMessage =
          'Storage permission denied. Please enable storage access in settings.';
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

  const [status, setStatus] = useState<
    'All' | 'Approved' | 'Pending' | 'Rejected'
  >('All');
  const [rows, setRows] = useState<ReturnType<typeof adapt>[]>([]);
  const [originalRecords, setOriginalRecords] = useState<TraceabilityRecord[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTraceabilityRecords({});
      setOriginalRecords(list);
      setRows(list.map(adapt));
    } catch (e) {
      setOriginalRecords([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filtered = useMemo(() => {
    return rows.filter(r => (status === 'All' ? true : r.status === status));
  }, [status, rows]);

  const renderListHeader = useCallback(
    () => (
      <ListHeaderWrapper
        status={status}
        setStatus={setStatus}
        handleBack={handleBack}
        handleNewRecord={handleNewRecord}
      />
    ),
    [status, setStatus, handleBack, handleNewRecord],
  );

  const renderEmptyState = useCallback(
    () => <EmptyStateWrapper status={status} navigation={navigation} />,
    [status, navigation],
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={it => it.id}
      ListHeaderComponent={renderListHeader}
      renderItem={({ item }) => (
        <RecordItem
          item={item}
          originalRecords={originalRecords}
          navigation={navigation}
          onGenerateDocument={handleGenerateDocument}
        />
      )}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={styles.contentPadding}
      refreshing={loading}
      ListEmptyComponent={renderEmptyState}
      onRefresh={loadData}
    />
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#145A1F',
  },
  appbarTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  filtersTitle: { color: PALETTE.text700, fontWeight: '700', marginBottom: 8 },
  chipsRow: { marginTop: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C7E0CC',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#E8F5E9', borderColor: '#A7D7B5' },
  chipText: { color: PALETTE.text700, fontWeight: '700' },
  chipTextActive: { color: PALETTE.green700 },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doc: { color: '#1B5E20', fontWeight: '800' },
  statusPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { color: '#2e7d32', fontWeight: '800' },
  recordGrid: { marginTop: 10, rowGap: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  outlineText: { color: PALETTE.text900, fontWeight: '800', marginLeft: 6 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#345bce',
  },
  secondaryText: { color: '#fff', fontWeight: '800', marginLeft: 6 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: PALETTE.text700,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: PALETTE.text500,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  fieldContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: PALETTE.text600 },
  fieldValue: { color: PALETTE.text900, fontWeight: '800' },
  spacer: { width: 44 },
  newRecordBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#145A1F',
  },
  headerPadding: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  itemSeparator: { height: 12 },
  contentPadding: { paddingVertical: 10, paddingHorizontal: 14 },
});
