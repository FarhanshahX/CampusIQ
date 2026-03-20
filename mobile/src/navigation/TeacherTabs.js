import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import TeacherDashboard from "../screens/teacher/TeacherDashboard";
import ScoresEnteringScreen from "../screens/teacher/ScoresEnteringScreen";
import AttendanceScreen from "../screens/teacher/TeacherAttendanceScreen";
import AnalyticsScreen from "../screens/teacher/AnalyticsScreen";
import TeacherResourceScreen from "../screens/teacher/TeacherResourceScreen";

const Tab = createBottomTabNavigator();

export default function TeacherNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            "Scores Entering": "stats-chart",
            Attendance: "calendar",
            Dashboard: "home",
            Analytics: "clipboard",
            Resources: "document",
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scores Entering" component={ScoresEnteringScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Dashboard" component={TeacherDashboard} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Resources" component={TeacherResourceScreen} />
    </Tab.Navigator>
  );
}
