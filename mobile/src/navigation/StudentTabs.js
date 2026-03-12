import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/student/DashboardScreen";
import ScoresScreen from "../screens/student/ScoresScreen";
import AttendanceScreen from "../screens/student/AttendanceScreen";
import ActivitiesScreen from "../screens/student/ActivitiesScreen";
import StudentHeader from "../components/StudentHeader";
import ClassResourcesScreen from "../screens/student/ClassResources";

const Tab = createBottomTabNavigator();

const StudentTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        header: () => <StudentHeader />,
        // headerShown: false,
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Scores: "stats-chart",
            Attendance: "calendar",
            Dashboard: "home",
            Activities: "clipboard",
            Resources: "book",
          };

          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scores" component={ScoresScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Resources" component={ClassResourcesScreen} />
    </Tab.Navigator>
  );
};

export default StudentTabs;
