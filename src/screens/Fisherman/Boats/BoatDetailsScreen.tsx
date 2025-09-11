// src/screens/Fisherman/Boats/BoatDetailsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import PALETTE from '../../../theme/palette';
import { getBoatById, Boat } from '../../../services/boat';

export default function BoatDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { boatId } = route.params as { boatId: number };
  
  const [boat, setBoat] = useState<Boat | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const fetchBoatDetails = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching boat details for ID:', boatId);
      const boatData = await getBoatById(boatId);
      console.log('Received boat data:', JSON.stringify(boatData, null, 2));
      setBoat(boatData);
    } catch (error: any) {
      console.error('Error fetching boat details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch boat details',
      });
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  useEffect(() => {
    fetchBoatDetails();
  }, [fetchBoatDetails]);

  const handleEdit = () => {
    (navigation as any).navigate('EditBoat', { boatId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Boat',
      'Are you sure you want to delete this boat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Toast.show({
              type: 'info',
              text1: 'Delete',
              text2: 'Delete functionality coming soon',
            });
          }
        },
      ]
    );
  };

  const handlePhotoPress = (photoIndex: number) => {
    if (!boat?.photos) return;
    setCurrentPhotoIndex(photoIndex);
    setSelectedPhoto(`https://smartaisoft.com/MFD-Trace-Fish/public/storage/${boat.photos[photoIndex].path}`);
    setPhotoModalVisible(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!boat?.photos) return;
    const totalPhotos = boat.photos.length;
    let newIndex = currentPhotoIndex;
    
    if (direction === 'prev') {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : totalPhotos - 1;
    } else {
      newIndex = currentPhotoIndex < totalPhotos - 1 ? currentPhotoIndex + 1 : 0;
    }
    
    setCurrentPhotoIndex(newIndex);
    setSelectedPhoto(`https://smartaisoft.com/MFD-Trace-Fish/public/storage/${boat.photos[newIndex].path}`);
  };

  const getDisplayPhotos = () => {
    if (!boat?.photos) return [];
    return showAllPhotos ? boat.photos : boat.photos.slice(0, 6);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading boat details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!boat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color={PALETTE.error} />
          <Text style={styles.errorTitle}>Boat Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The boat you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Debug: Log the boat object being displayed
  console.log('Displaying boat:', JSON.stringify(boat, null, 2));
  console.log('Boat name:', boat.name);
  console.log('Boat type:', boat.type);
  console.log('Boat length:', boat.length_m);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={PALETTE.text900} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{boat.name || 'Unnamed Boat'}</Text>
          <Text style={styles.headerSubtitle}>
            {boat.registration_number}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
          >
            <Icon name="edit" size={20} color={PALETTE.green700} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
          >
            <Icon name="delete" size={20} color={PALETTE.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Registration Number</Text>
              <Text style={styles.infoValue}>{boat.registration_number}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Boat Type</Text>
              <Text style={styles.infoValue}>{boat.type || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Boat Category</Text>
              <Text style={styles.infoValue}>{boat.boat_type || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(boat.status) }]}>
                <Text style={styles.statusText}>{boat.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dimensions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="straighten" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Dimensions</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Length</Text>
              <Text style={styles.infoValue}>{boat.length_m ? `${boat.length_m}m` : 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Width</Text>
              <Text style={styles.infoValue}>{boat.width_m ? `${boat.width_m}m` : 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Crew Capacity</Text>
              <Text style={styles.infoValue}>{boat.capacity_crew || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weight Capacity</Text>
              <Text style={styles.infoValue}>{boat.capacity_weight_kg ? `${boat.capacity_weight_kg}kg` : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Technical Specifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="engineering" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Technical Specifications</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Boat Size</Text>
              <Text style={styles.infoValue}>{boat.boat_size ? `${boat.boat_size} tons` : 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Boat Capacity</Text>
              <Text style={styles.infoValue}>{boat.boat_capacity ? `${boat.boat_capacity} tons` : 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Engine Power</Text>
              <Text style={styles.infoValue}>{boat.engine_power || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Year Built</Text>
              <Text style={styles.infoValue}>{boat.year_built || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Licenses & Approvals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="verified" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Licenses & Approvals</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Boat License</Text>
              <Text style={styles.infoValue}>{boat.boat_license_no || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>MFD Approval</Text>
              <Text style={styles.infoValue}>{boat.mfd_approved_no || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Insurance</Text>
              <Text style={styles.infoValue}>{boat.insurance_info || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>License Info</Text>
              <Text style={styles.infoValue}>{boat.license_info || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="build" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Equipment</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fishing Equipment</Text>
              <Text style={styles.infoValue}>{boat.fishing_equipment || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Safety Equipment</Text>
              <Text style={styles.infoValue}>{boat.safety_equipment || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fish Holds</Text>
              <Text style={styles.infoValue}>{boat.number_of_fish_holds || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Home Port</Text>
              <Text style={styles.infoValue}>{boat.home_port || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Boat Photos */}
        {boat.photos && boat.photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="photo-camera" size={20} color={PALETTE.green700} />
              <Text style={styles.sectionTitle}>Boat Photos</Text>
              <Text style={styles.photoCountBadge}>
                {boat.photos.length}
              </Text>
            </View>
            
            <View style={styles.photoGrid}>
              {getDisplayPhotos().map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoItem}
                  onPress={() => handlePhotoPress(index)}
                >
                  <Image
                    source={{ uri: `https://smartaisoft.com/MFD-Trace-Fish/public/storage/${photo.path}` }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <Icon name="zoom-in" size={20} color="#fff" />
                  </View>
                  {index === 5 && !showAllPhotos && boat.photos && boat.photos.length > 6 && (
                    <View style={styles.morePhotosOverlay}>
                      <Text style={styles.morePhotosText}>
                        +{boat.photos.length - 6} more
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {boat.photos && boat.photos.length > 6 && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => setShowAllPhotos(!showAllPhotos)}
              >
                <Text style={styles.showAllButtonText}>
                  {showAllPhotos ? 'Show Less' : `Show All ${boat.photos.length} Photos`}
                </Text>
                <Icon 
                  name={showAllPhotos ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={20} 
                  color={PALETTE.green700} 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Owner Information */}
        {boat.owner && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="person" size={20} color={PALETTE.green700} />
              <Text style={styles.sectionTitle}>Owner Information</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Owner Name</Text>
                <Text style={styles.infoValue}>{boat.owner.name}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{boat.owner.phone}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fishing Zone</Text>
                <Text style={styles.infoValue}>{boat.owner.fishing_zone}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Port Location</Text>
                <Text style={styles.infoValue}>{boat.owner.port_location}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {boat.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="note" size={20} color={PALETTE.green700} />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            
            <Text style={styles.notesText}>{boat.notes}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="schedule" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Timestamps</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(boat.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(boat.updated_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setPhotoModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          {boat?.photos && boat.photos.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.modalNavButton}
                onPress={() => navigatePhoto('prev')}
              >
                <Icon name="chevron-left" size={30} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalNavButton, styles.modalNavButtonRight]}
                onPress={() => navigatePhoto('next')}
              >
                <Icon name="chevron-right" size={30} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
          
          {boat?.photos && boat.photos.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {currentPhotoIndex + 1} of {boat.photos.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return PALETTE.green700;
    case 'maintenance':
      return PALETTE.warn;
    case 'retired':
      return PALETTE.error;
    default:
      return PALETTE.text500;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: PALETTE.text500,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: PALETTE.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
    marginLeft: 8,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  infoLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: PALETTE.text900,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 14,
    color: PALETTE.text700,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: PALETTE.text500,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text900,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: PALETTE.text500,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: PALETTE.surface,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  photoCountBadge: {
    backgroundColor: PALETTE.green700,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  morePhotosText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.green700,
    marginTop: 8,
  },
  showAllButtonText: {
    color: PALETTE.green700,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  modalNavButton: {
    position: 'absolute',
    top: '50%',
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    transform: [{ translateY: -20 }],
  },
  modalNavButtonRight: {
    left: 'auto',
    right: 20,
  },
  modalImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 100,
  },
  photoCounter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
