import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const AddSchedule = () => {
  const [subjects, setSubjects] = useState([]);
  const [linkedSubjects, setLinkedSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        if (userData && userData.id) {
          setUserId(userData.id); // Store user_id for POST
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();

    fetchSubjectsAndLinkedSubjects();
  }, []);

  const fetchSubjectsAndLinkedSubjects = async () => {
    try {
      const [subjectsResponse, linkedSubjectsResponse] = await Promise.all([
        axios.get('https://lockup.pro/api/subs'),
        axios.get('https://lockup.pro/api/linkedSubjects'),
      ]);

      if (subjectsResponse.data && Array.isArray(subjectsResponse.data.data)) {
        setSubjects(subjectsResponse.data.data);
      } else {
        console.error('Unexpected data format for subjects:', subjectsResponse.data);
        Alert.alert('Error', 'Failed to load subjects.');
      }

      if (linkedSubjectsResponse.data && Array.isArray(linkedSubjectsResponse.data.data)) {
        setLinkedSubjects(linkedSubjectsResponse.data.data.map(item => item.subject_id));
      } else {
        console.error('Unexpected data format for linked subjects:', linkedSubjectsResponse.data);
        Alert.alert('Error', 'Failed to load linked subjects.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load subjects and linked subjects.');
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleAddSchedule = async () => {
    if (!selectedSubject) {
      Alert.alert('Validation Error', 'Please select a subject.');
      return;
    }

    try {
      const scheduleData = {
        user_id: userId,
        subject_id: selectedSubject.id,
      };

      console.log('Submitting schedule data:', scheduleData);

      const response = await axios.post('https://lockup.pro/api/linkedSubjects', scheduleData);

      if (response.data) {
        console.log('Schedule added successfully:', response.data);
        Alert.alert('Success', 'Schedule added successfully!');

        fetchSubjectsAndLinkedSubjects();
      } else {
        console.log('Unexpected response data:', response.data);
        Alert.alert('Error', 'Failed to add schedule.');
      }
    } catch (error) {
      console.error('Failed to add schedule:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      Alert.alert('Error', 'Failed to add schedule.');
    }
  };

  const handleUnlinkSubject = () => {
    navigation.navigate('UnlinkSubjectScreen');
  };

  const renderSubjectRow = (subject) => (
    <TouchableOpacity
      key={subject.id}
      style={[
        styles.tableRow,
        selectedSubject && selectedSubject.id === subject.id ? styles.selectedRow : null,
      ]}
      onPress={() => setSelectedSubject(subject)}
    >
      <Text style={[styles.tableCell, styles.subjectName]}>{subject.name}</Text>
      <Text style={[styles.tableCell, styles.subjectCode]}>{subject.code}</Text>
      <Text style={[styles.tableCell, styles.timeCell]}>{formatTime(subject.start_time)}</Text>
      <Text style={[styles.tableCell, styles.timeCell]}>{formatTime(subject.end_time)}</Text>
      <Text style={[styles.tableCell, styles.sectionCell]}>{subject.section}</Text>
    </TouchableOpacity>
  );

  const filteredSubjects = subjects.filter(subject => !linkedSubjects.includes(subject.id));

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select a Subject</Text>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tableContainer}>
          <ScrollView horizontal>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.subjectName]}>Subject Name</Text>
                <Text style={[styles.tableHeaderCell, styles.subjectCode]}>Code</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCell]}>Start Time</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCell]}>End Time</Text>
                <Text style={[styles.tableHeaderCell, styles.sectionCell]}>Section</Text>
              </View>
              {filteredSubjects.map(renderSubjectRow)}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {selectedSubject && (
        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>{selectedSubject.name}</Text>
          <Text style={styles.detailText}>Code: {selectedSubject.code}</Text>
          <Text style={styles.detailText}>Time: {formatTime(selectedSubject.start_time)} to {formatTime(selectedSubject.end_time)}</Text>
          <Text style={styles.detailText}>Section: {selectedSubject.section}</Text>
          <Text style={styles.detailText}>{selectedSubject.description}</Text>
          <Text style={styles.readMore}>Read more →</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleAddSchedule} disabled={!selectedSubject}>
        <Text style={styles.buttonText}>Link Subject</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.unlinkButton} onPress={handleUnlinkSubject}>
        <Text style={styles.unlinkButtonText}>Unlink Subject</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff', // Example: background color similar to UnlinkSubjectScreen
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: -10,
    marginBottom: 10
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#dcdcdc', // Example: border color similar to UnlinkSubjectScreen
    borderRadius: 8, // Example: adjusted border radius
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007BFF', // Example: background color similar to UnlinkSubjectScreen
    paddingVertical: 10, // Adjusted padding
    paddingHorizontal: 8, // Adjusted padding
  },
  tableHeaderCell: {
    padding: 12, // Adjusted padding
    fontWeight: '600', // Adjusted font weight
    color: '#ffffff', // Example: text color similar to UnlinkSubjectScreen
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdcdc', // Example: border color similar to UnlinkSubjectScreen
  },
  tableCell: {
    padding: 12, // Adjusted padding
    textAlign: 'center',
  },
  subjectName: {
    flex: 2,
    minWidth: 180, // Adjusted minWidth
  },
  subjectCode: {
    flex: 1,
    minWidth: 100, // Adjusted minWidth
  },
  timeCell: {
    flex: 1,
    minWidth: 100, // Adjusted minWidth
  },
  sectionCell: {
    flex: 1,
    minWidth: 100, // Adjusted minWidth
  },
  selectedRow: {
    backgroundColor: '#f0f0f0', // Example: background color similar to UnlinkSubjectScreen
  },
  detailContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 8, // Adjusted border radius
    backgroundColor: '#ffffff', // Example: background color similar to UnlinkSubjectScreen
    shadowColor: '#000', // Adjusted shadow color
    shadowOffset: { width: 0, height: 4 }, // Adjusted shadow offset
    shadowOpacity: 0.2, // Adjusted shadow opacity
    shadowRadius: 6, // Adjusted shadow radius
    elevation: 3, // Adjusted elevation
  },
  detailTitle: {
    fontSize: 24, // Adjusted font size
    fontWeight: '600', // Adjusted font weight
    marginBottom: 12, // Adjusted margin
    color: '#333', // Example: text color similar to UnlinkSubjectScreen
  },
  detailText: {
    fontSize: 16,
    marginVertical: 4, // Adjusted margin
    color: '#555', // Example: text color similar to UnlinkSubjectScreen
  },
  readMore: {
    fontSize: 16,
    color: '#007BFF', // Example: link color similar to UnlinkSubjectScreen
    marginTop: 12, // Adjusted margin
  },
  button: {
    marginTop: 20,
    paddingVertical: 14, // Adjusted padding
    backgroundColor: '#007BFF', // Example: button color similar to UnlinkSubjectScreen
    borderRadius: 8, // Adjusted border radius
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff', // Example: text color similar to UnlinkSubjectScreen
    fontSize: 18,
    fontWeight: '600', // Adjusted font weight
  },
  unlinkButton: {
    marginTop: 10,
    paddingVertical: 14, // Adjusted padding
    backgroundColor: '#FF4136', // Example: button color similar to UnlinkSubjectScreen
    borderRadius: 8, // Adjusted border radius
    alignItems: 'center',
  },
  unlinkButtonText: {
    color: '#ffffff', // Example: text color similar to UnlinkSubjectScreen
    fontSize: 18,
    fontWeight: '600', // Adjusted font weight
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddSchedule;
