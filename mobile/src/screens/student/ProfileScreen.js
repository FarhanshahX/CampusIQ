// import { View, Text } from "react-native";

// const ProfileScreen = () => {
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text style={{ fontSize: 20, fontWeight: "600" }}>Profile</Text>
//     </View>
//   );
// };

// export default ProfileScreen;

import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";

const ProfileScreen = () => {
  const { logout } = useAuth();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <TouchableOpacity style={logoutBtn} onPress={logout}>
          <Text style={{ color: "#fff" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const logoutBtn = {
  backgroundColor: "#DC2626",
  padding: 14,
  borderRadius: 8,
  alignItems: "center",
  marginTop: 24,
};

export default ProfileScreen;
