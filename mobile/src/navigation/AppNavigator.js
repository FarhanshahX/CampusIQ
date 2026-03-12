import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/student/StudentRegisterScreen";
import StudentTabs from "./StudentTabs";
import TeacherTabs from "./TeacherTabs";

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
          <Stack.Screen name="Teacher" component={TeacherTabs} />
        ) : (
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            {/* profile and messages are part of root stack so header nav works
                and they don't show up in the tab bar */}
            <Stack.Screen
              name="Profile"
              component={require("../screens/student/ProfileScreen").default}
            />
            <Stack.Screen
              name="Messages"
              component={require("../screens/student/MessagesScreen").default}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
