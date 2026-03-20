import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");

  // Analytics
  const [overallAttendance, setOverallAttendance] = useState("0");
  const [fetching, setFetching] = useState(false);
  const [internal, setInternal] = useState(Array(6).fill(0));
  const [experiments, setExperiments] = useState(Array(10).fill(""));
  const [assignments, setAssignments] = useState(Array(2).fill(""));

  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!user || !user._id) return;
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]._id);
    }
  }, [subjects, selectedSubject]);

  useEffect(() => {
    if (selectedSubject) {
      fetchScores(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchInitialData = async () => {
    try {
      // Fetch student data & subjects
      const studentRes = await api.get(`/admin/students/${user._id}`);
      setStudent(studentRes.data);
      if (studentRes.data?.department?._id) {
        fetchSubjects(studentRes.data.department._id);
      }

      // Fetch announcements (Top 2 important)
      const annRes = await api.get(`/announcements/student`);
      const importantAnns = annRes.data
        .filter((a) => a.isImportant)
        .slice(0, 2);
      setAnnouncements(importantAnns);

      // Fetch Tasks
      fetchTasks();

      // Fetch Overall Attendance
      const attRes = await api.get(
        `/attendance/student-overall/${user._id}/${user.section}`,
      );
      setOverallAttendance(attRes.data.rate);
    } catch (error) {
      console.error("Error fetching initial data", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/student/${user._id}`);
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  };

  const fetchSubjects = async (departmentId) => {
    try {
      const res = await api.get(`/subjects/${departmentId}`);
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubject(res.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching subjects", error);
    }
  };

  const fetchScores = useCallback(
    async (subject) => {
      setFetching(true);
      try {
        const res = await api.get(
          `/scores/${user._id}/${encodeURIComponent(subject)}`,
        );
        const { marks } = res.data || {};

        if (marks) {
          setInternal(
            Array(6)
              .fill(0)
              .map((_, i) =>
                marks.internalTests && marks.internalTests[i] != null
                  ? marks.internalTests[i]
                  : 0,
              ),
          );
          setExperiments(
            Array(10)
              .fill("")
              .map((_, i) =>
                marks.experiments && marks.experiments[i] != null
                  ? String(marks.experiments[i])
                  : "",
              ),
          );
          setAssignments(
            Array(2)
              .fill("")
              .map((_, i) =>
                marks.assignments && marks.assignments[i] != null
                  ? String(marks.assignments[i])
                  : "",
              ),
          );
        } else {
          setInternal(Array(6).fill(0));
          setExperiments(Array(10).fill(""));
          setAssignments(Array(2).fill(""));
        }
      } catch (_) {
        setInternal(Array(6).fill(0));
        setExperiments(Array(10).fill(""));
        setAssignments(Array(2).fill(""));
      } finally {
        setFetching(false);
      }
    },
    [user._id],
  );

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }
    try {
      await api.post("/tasks", {
        studentId: user._id,
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setModalVisible(false);
      fetchTasks();
    } catch (error) {
      Alert.alert("Error", "Failed to create task");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task", error);
    }
  };

  // Derived Data
  const cgpa = student?.cgpa || [];
  const cgpaData = cgpa.filter((val) => val > 0);
  const semesters = cgpaData.map((_, index) => `S${index + 1}`);

  const completedExperiments = experiments.filter(
    (val) => val !== "" && parseFloat(val) > 0,
  ).length;
  const completedAssignments = assignments.filter(
    (val) => val !== "" && parseFloat(val) > 0,
  ).length;

  const currentSubjectObj = subjects.find((s) => s._id === selectedSubject);
  const subjectNameLabel = currentSubjectObj
    ? currentSubjectObj.subjectName
    : "Selected Subject";

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 1. ANNOUNCEMENTS */}
        {announcements.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Important Announcements</Text>
            </View>
            {announcements.map((ann, idx) => (
              <View
                key={ann._id}
                style={[styles.announcementRow, idx > 0 && styles.borderTop]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.announcementTitle} numberOfLines={1}>
                    {ann.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Announcements")}
                >
                  <View style={styles.viewMessageBtn}>
                    <Text style={styles.viewMessageText}>View</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#3B5BDB"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 2. TODO TASKS */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Todo Tasks</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons
                name="add"
                size={16}
                color="#FFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.addBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>
              No upcoming tasks. You're all caught up!
            </Text>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <TouchableOpacity
                key={task._id}
                style={styles.taskRow}
                onPress={() => handleToggleTask(task)}
              >
                <Ionicons
                  name={
                    task.isCompleted ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={22}
                  color={task.isCompleted ? "#10B981" : "#9CA3AF"}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.isCompleted && styles.taskCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description ? (
                    <Text style={styles.taskDesc} numberOfLines={1}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    styles[`priority${task.priority}`],
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      styles[`priorityText${task.priority}`],
                    ]}
                  >
                    {task.priority}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 3. CGPA VISUALIZATION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CGPA Performance</Text>
          <Text style={styles.currentcgpa}>
            Current CGPA: {cgpaData[cgpaData.length - 1]}
          </Text>
          {cgpaData.length > 0 ? (
            <LineChart
              data={{
                labels: semesters,
                datasets: [{ data: cgpaData }],
              }}
              width={screenWidth - 60}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.promptBox}>
              <Ionicons name="bar-chart-outline" size={32} color="#9CA3AF" />
              <Text style={styles.noDataText}>No CGPA data available.</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Text style={styles.linkText}>Enter your CGPA in Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. TOTAL ATTENDANCE */}
        <View style={styles.attendanceCard}>
          <View>
            <Text style={styles.attendanceLabel}>Overall Attendance</Text>
            <Text style={styles.attendanceSubLabel}>Across all subjects</Text>
          </View>
          <Text style={styles.attendanceText}>{overallAttendance}%</Text>
        </View>

        {/* SUBJECT SELECTION FOR MODULE DATA */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>SUBJECT DATA</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedSubject}
              onValueChange={(value) => setSelectedSubject(value)}
              style={styles.picker}
            >
              {subjects.map((sub) => (
                <Picker.Item
                  key={sub._id}
                  label={sub.subjectName}
                  value={sub._id}
                />
              ))}
            </Picker>
          </View>

          {/* 5. EXPERIMENTS & ASSIGNMENTS PROGRESS */}
          {fetching ? (
            <ActivityIndicator
              size="small"
              color="#3B5BDB"
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={{ marginTop: 20 }}>
              <View style={styles.row}>
                {/* Experiments Donut */}
                <View style={[styles.halfCardBordered]}>
                  <Text style={styles.donutTitle}>Experiments</Text>
                  <AnimatedCircularProgress
                    size={100}
                    width={10}
                    fill={(completedExperiments / 10) * 100}
                    tintColor="#10B981"
                    backgroundColor="#F3F4F6"
                    lineCap="round"
                    rotation={0}
                  >
                    {() => (
                      <Text style={styles.insideText}>
                        {completedExperiments}/10
                      </Text>
                    )}
                  </AnimatedCircularProgress>
                </View>

                {/* Assignments Donut */}
                <View style={[styles.halfCardBordered]}>
                  <Text style={styles.donutTitle}>Assignments</Text>
                  <AnimatedCircularProgress
                    size={100}
                    width={10}
                    fill={(completedAssignments / 2) * 100}
                    tintColor="#3B5BDB"
                    backgroundColor="#F3F4F6"
                    lineCap="round"
                    rotation={0}
                  >
                    {() => (
                      <Text style={styles.insideText}>
                        {completedAssignments}/2
                      </Text>
                    )}
                  </AnimatedCircularProgress>
                </View>
              </View>

              {/* 6. INTERNAL ASSESSMENTS CHART */}
              <View style={{ marginTop: 24 }}>
                <Text style={styles.chartTitle}>
                  Internal Assessments: {subjectNameLabel}
                </Text>
                <LineChart
                  data={{
                    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
                    datasets: [{ data: internal }],
                  }}
                  width={screenWidth - 60}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(59, 91, 219, ${opacity})`, // Blue line
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* NEW TASK MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="E.g., Complete DBMS Lab"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                multiline
                placeholder="Add details..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.prioritySelector}>
                {["Low", "Medium", "High"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOpt,
                      taskPriority === p && styles.priorityOptActive,
                    ]}
                    onPress={() => setTaskPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityOptText,
                        taskPriority === p && styles.priorityOptTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateTask}>
              <Text style={styles.saveBtnText}>Save Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const chartConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#10B981",
    // stroke: "#000000",
  },
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  currentcgpa: {
    fontSize: 23,
    fontWeight: "500",
    color: "#111827",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  announcementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  announcementTitle: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    paddingRight: 10,
  },
  viewMessageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewMessageText: {
    fontSize: 12,
    color: "#3B5BDB",
    fontWeight: "600",
    marginRight: 2,
  },
  addBtn: {
    backgroundColor: "#3B5BDB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  taskTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  taskDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityLow: { backgroundColor: "#F3F4F6" },
  priorityTextLow: { color: "#4B5563" },
  priorityMedium: { backgroundColor: "#FEF3C7" },
  priorityTextMedium: { color: "#D97706" },
  priorityHigh: { backgroundColor: "#FEE2E2" },
  priorityTextHigh: { color: "#DC2626" },
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  chart: {
    marginTop: 10,
    borderRadius: 16,
    alignSelf: "center",
  },
  promptBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 10,
  },
  noDataText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  linkText: {
    color: "#3B5BDB",
    fontWeight: "600",
    marginTop: 12,
    textDecorationLine: "underline",
  },
  attendanceCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  attendanceLabel: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  attendanceSubLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 2,
  },
  attendanceText: {
    color: "#10B981",
    fontSize: 32,
    fontWeight: "800",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#6B7280",
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfCardBordered: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  donutTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 16,
  },
  insideText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: "#111827",
  },
  prioritySelector: {
    flexDirection: "row",
    gap: 12,
  },
  priorityOpt: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  priorityOptActive: {
    borderColor: "#3B5BDB",
    backgroundColor: "#EFF6FF",
  },
  priorityOptText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  priorityOptTextActive: {
    color: "#3B5BDB",
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#3B5BDB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DashboardScreen;
