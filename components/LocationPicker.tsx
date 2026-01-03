import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface LocationData {
  location: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  error?: string;
  label?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  error,
  label = 'Location',
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    formatted_address: string;
    description: string;
    location: { lat: number; lng: number };
  }>>([]);

  const handlePickCurrentLocation = useCallback(async () => {
    setIsLoadingCurrentLocation(true);
    try {
      // Check if expo-location is available
      let Location;
      try {
        Location = require('expo-location');
      } catch {
        Alert.alert(
          'Not Available',
          'Location services require expo-location package. Please install it: npx expo install expo-location'
        );
        setIsLoadingCurrentLocation(false);
        return;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to pick your current location.'
        );
        setIsLoadingCurrentLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const accuracy = location.coords.accuracy || 0;

      // Use Google Maps Reverse Geocoding API to get location details
      const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_KEY || process.env.GOOGLE_KEY;
      
      if (!GOOGLE_API_KEY) {
        Alert.alert(
          'Configuration Error',
          'Google Maps API key is not configured. Please add EXPO_PUBLIC_GOOGLE_KEY to your environment variables.'
        );
        setIsLoadingCurrentLocation(false);
        return;
      }

      // Reverse geocode using Google Maps API
      const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const reverseResponse = await fetch(reverseGeocodeUrl);
      const reverseData = await reverseResponse.json();
      
      let locationString = 'Current Location';
      
      if (reverseData.status === 'OK' && reverseData.results.length > 0) {
        // Use the first result's formatted address
        locationString = reverseData.results[0].formatted_address;
      } else {
        // Fallback to expo-location reverse geocoding if Google fails
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          
          if (geocode.length > 0) {
            const address = geocode[0];
            locationString = [
              address.street,
              address.city,
              address.region,
              address.country,
            ]
              .filter(Boolean)
              .join(', ') || 'Current Location';
          }
        } catch (fallbackErr) {
          // Use coordinates as fallback
          locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      }

      const locationData: LocationData = {
        location: locationString,
        latitude,
        longitude,
        accuracy,
      };

      onChange(locationData);
      setSearchQuery(locationString);
      setIsModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to get current location. Please try again.');
    } finally {
      setIsLoadingCurrentLocation(false);
    }
  }, [onChange]);

  const handleSearchLocation = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_KEY || process.env.GOOGLE_KEY;
      
      if (!GOOGLE_API_KEY) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Use Google Places Autocomplete API for better search suggestions
      const encodedQuery = encodeURIComponent(query);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        // Get place details for each prediction to get coordinates
        const predictions = data.predictions.slice(0, 5);
        
        // Fetch place details for coordinates
        const placeDetailsPromises = predictions.map(async (prediction: any) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${GOOGLE_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.status === 'OK' && detailsData.result) {
              return {
                formatted_address: detailsData.result.formatted_address || prediction.description,
                description: prediction.description,
                location: detailsData.result.geometry.location,
              };
            }
            return {
              formatted_address: prediction.description,
              description: prediction.description,
              location: { lat: 0, lng: 0 },
            };
          } catch {
            return {
              formatted_address: prediction.description,
              description: prediction.description,
              location: { lat: 0, lng: 0 },
            };
          }
        });

        const results = await Promise.all(placeDetailsPromises);
        setSearchResults(results.filter((r) => r.location.lat !== 0 && r.location.lng !== 0));
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!isModalVisible) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearchLocation(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isModalVisible, handleSearchLocation]);

  const handleClear = useCallback(() => {
    onChange(null);
    setSearchQuery('');
    setSearchResults([]);
  }, [onChange]);

  const handleSelectSearchResult = useCallback((result: { formatted_address: string; description: string; location: { lat: number; lng: number } }) => {
    // Use the description (the name shown in dropdown) as the location name
    const locationName = result.description || result.formatted_address;
    
    const locationData: LocationData = {
      location: locationName,
      latitude: result.location.lat,
      longitude: result.location.lng,
      accuracy: 0,
    };

    onChange(locationData);
    setSearchQuery(locationName);
    setSearchResults([]);
    setIsModalVisible(false);
  }, [onChange]);

  useEffect(() => {
    if (value) {
      setSearchQuery(value.location);
      setManualLatitude(value.latitude.toString());
      setManualLongitude(value.longitude.toString());
    } else {
      setSearchQuery('');
      setManualLatitude('');
      setManualLongitude('');
    }
    setSearchResults([]);
  }, [value]);

  useEffect(() => {
    if (!isModalVisible) {
      setSearchResults([]);
    }
  }, [isModalVisible]);

  const borderColor = error
    ? colors.semantic.error
    : value
    ? colors.primary.green
    : colors.neutral.gray.lighter;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputContainer, { borderColor }]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {value ? value.location : 'Select location'}
        </Text>
        <View style={styles.iconsContainer}>
          {value && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.neutral.gray.medium} />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-down" size={20} color={colors.neutral.gray.medium} />
        </View>
      </TouchableOpacity>
      {value && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesText}>
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </Text>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Location Picker Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              {/* Current Location Button */}
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handlePickCurrentLocation}
                disabled={isLoadingCurrentLocation}
                activeOpacity={0.7}
              >
                {isLoadingCurrentLocation ? (
                  <ActivityIndicator size="small" color={colors.primary.green} />
                ) : (
                  <Ionicons name="locate" size={20} color={colors.primary.green} />
                )}
                <Text style={styles.currentLocationText}>
                  {isLoadingCurrentLocation ? 'Getting location...' : 'Pick Current Location'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Search Location with Google Maps - Dropdown */}
              <View style={styles.searchContainer}>
                <Text style={styles.searchLabel}>Search Location (Google Maps)</Text>
                <View style={styles.searchInputWrapper}>
                  <View style={styles.searchInputContainer}>
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color={colors.neutral.gray.medium}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Type to search location..."
                      placeholderTextColor={colors.neutral.gray.medium}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="words"
                      returnKeyType="search"
                    />
                    {isSearching && (
                      <ActivityIndicator size="small" color={colors.primary.green} style={styles.searchLoading} />
                    )}
                  </View>

                  {/* Dropdown Results */}
                  {searchResults.length > 0 && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {searchResults.map((result, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              index === searchResults.length - 1 && styles.dropdownItemLast,
                            ]}
                            onPress={() => handleSelectSearchResult(result)}
                            activeOpacity={0.7}
                          >
                          <Ionicons name="location-outline" size={18} color={colors.primary.green} />
                          <View style={styles.dropdownItemTextContainer}>
                            <Text style={styles.dropdownItemText} numberOfLines={1}>
                              {result.description || result.formatted_address}
                            </Text>
                            {result.formatted_address && result.formatted_address !== result.description && (
                              <Text style={styles.dropdownItemSubtext} numberOfLines={1}>
                                {result.formatted_address}
                              </Text>
                            )}
                          </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Manual Entry */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.manualEntryContainer}>
                <Text style={styles.manualEntryLabel}>Enter Location Manually</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Location name (e.g., Nairobi city)"
                  placeholderTextColor={colors.neutral.gray.medium}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="words"
                />
                <View style={styles.coordinatesRow}>
                  <View style={styles.coordinateInputContainer}>
                    <Text style={styles.coordinateLabel}>Latitude</Text>
                    <TextInput
                      style={styles.coordinateInput}
                      placeholder="-1.3621871"
                      placeholderTextColor={colors.neutral.gray.medium}
                      keyboardType="numeric"
                      value={manualLatitude}
                      onChangeText={setManualLatitude}
                    />
                  </View>
                  <View style={styles.coordinateInputContainer}>
                    <Text style={styles.coordinateLabel}>Longitude</Text>
                    <TextInput
                      style={styles.coordinateInput}
                      placeholder="36.7024963"
                      placeholderTextColor={colors.neutral.gray.medium}
                      keyboardType="numeric"
                      value={manualLongitude}
                      onChangeText={setManualLongitude}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (!searchQuery.trim() || !manualLatitude || !manualLongitude) && styles.saveButtonDisabled,
                  ]}
                  onPress={() => {
                    const lat = parseFloat(manualLatitude);
                    const lng = parseFloat(manualLongitude);
                    if (searchQuery.trim() && !isNaN(lat) && !isNaN(lng)) {
                      onChange({
                        location: searchQuery,
                        latitude: lat,
                        longitude: lng,
                        accuracy: 0,
                      });
                      setIsModalVisible(false);
                    }
                  }}
                  disabled={!searchQuery.trim() || !manualLatitude || !manualLongitude}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Save Location</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LocationPicker;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 52,
    backgroundColor: colors.background.primary,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.neutral.gray.medium,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    padding: 4,
  },
  coordinatesContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.semantic.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.greenLight + '20',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  currentLocationText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral.gray.lighter,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  searchContainer: {
    gap: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  searchInputWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  searchLoading: {
    marginLeft: 8,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lightest,
    backgroundColor: colors.background.primary,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemTextContainer: {
    flex: 1,
    gap: 2,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  manualEntryContainer: {
    gap: 12,
  },
  manualEntryLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
  },
  manualInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInputContainer: {
    flex: 1,
    gap: 8,
  },
  coordinateLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.text.secondary,
  },
  coordinateInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  saveButton: {
    backgroundColor: colors.primary.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
});

