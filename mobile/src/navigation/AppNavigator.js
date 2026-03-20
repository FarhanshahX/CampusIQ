import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/student/StudentRegisterScreen";
import StudentTabs from "./StudentTabs";
import TeacherTabs from "./TeacherTabs";

// Student Screens
import StudentProfileScreen from "../screens/student/ProfileScreen";
import StudentAnnouncementScreen from "../screens/student/AnnouncementScreen";
import AnalyticsScreen from "../screens/teacher/AnalyticsScreen";

// Teacher Screens
import TeacherProfileScreen from "../screens/teacher/ProfileScreen";
import TeacherAnnouncementScreen from "../screens/teacher/AnnouncementScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === "teacher" ? (
          <>
            <Stack.Screen name="Teacher" component={TeacherTabs} />
            <Stack.Screen name="Profile" component={TeacherProfileScreen} />
            <Stack.Screen
              name="Announcements"
              component={TeacherAnnouncementScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen name="Profile" component={StudentProfileScreen} />
            <Stack.Screen
              name="Announcements"
              component={StudentAnnouncementScreen}
            />
          </>
        )}
        <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
