import { useState, useEffect } from "react";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/axios";

const Profile = () => {
  const { user, login, logout, activeSubject, changeActiveSubject } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Switch Subjects feature
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [teacherRes, subjectsRes] = await Promise.all([
        api.get(`/admin/teachers/${user._id}`),
        api.get(`/subjects/teacher/${user._id}`),
      ]);

      const t = teacherRes.data;
      setTeacher(t);
      setFirstName(t.firstName || "");
      setLastName(t.lastName || "");
      setEmail(t.email || "");
      setDesignation(t.designation || "");
      setPhotoUrl(t.photoUrl || "");

      if (subjectsRes.data && subjectsRes.data.length > 0) {
        setSubjects(subjectsRes.data);
      }
    } catch (error) {
      console.error("Error fetching profile", error);
      setMessage({ type: "error", text: "Failed to load profile data" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const updateData = {
        firstName,
        lastName,
        email,
        designation,
        photoUrl,
        userId: user._id,
      };

      const res = await api.put(`/teacher/profile`, updateData);

      // Update local storage and context
      const updatedUser = { ...user, ...res.data };
      login(updatedUser);

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
      const errorMsg = error.response?.data?.message || "Failed to update profile";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill all password fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      await api.put(`/teacher/profile`, {
        password: newPassword,
        userId: user._id,
      });

      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error) {
      console.error("Error updating password", error);
      setMessage({
        type: "error",
        text: "Failed to update password. Please check your current password.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 px-4 text-black">
      {/* Header Area */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-xl">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-1 right-1 bg-indigo-600 p-2.5 rounded-full text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition transform hover:scale-110">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <input
                type="file"
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
            </label>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
            {firstName} {lastName}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100">
              {teacher?.employeeId}
            </span>
            <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-100">
              {designation}
            </span>
          </div>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.type === "success" ? (
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">
              Personal Details
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                isEditing
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "text-white bg-white-50 text-white-600 hover:bg-white-100"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isEditing ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                )}
              </svg>
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          {/* Personal Details Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Enter designation"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving && (
                    <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
                  )}
                  <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Full Name
                    </label>
                    <p className="text-gray-900 font-extrabold">
                      {firstName} {lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Email Address
                    </label>
                    <p className="text-gray-900 font-extrabold">{email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Designation
                    </label>
                    <p className="text-gray-900 font-extrabold">
                      {designation}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4m-6 7a2 2 0 100-4 2 2 0 000 4z"
                      />
                    </svg>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Employee ID
                    </label>
                    <p className="text-gray-900 font-extrabold">
                      {teacher?.employeeId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Management */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between p-8 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-900 text-white rounded-2xl">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zM7 11V7a5 5 0 0110 0v4"
                    />
                  </svg>
                </div>
                <h3 className="text-white text-lg font-extrabold text-gray-900 text-left">
                  Security & Password
                </h3>
              </div>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${showPasswordSection ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showPasswordSection && (
              <div className="p-8 pt-0 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="h-px bg-gray-100 mb-8" />
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium text-black"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium text-black"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 outline-none font-medium text-black"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {saving && (
                      <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
                    )}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Active Subject Selection */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">
              Active Subject
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Your current active context. Screens default to this subject.
            </p>

            <div className="space-y-3">
              {subjects.length > 0 ? (
                subjects.map((subject) => {
                  const isActive = activeSubject?._id === subject._id;
                  return (
                    <button
                      key={subject._id}
                      onClick={() => changeActiveSubject(subject)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
                        isActive
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900"
                          : "border-gray-50 hover:border-indigo-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p
                          className={`font-bold text-sm truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}
                        >
                          {subject.subjectName}
                        </p>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-indigo-500" : "text-gray-400"}`}
                        >
                          {subject.subjectCode}
                        </p>
                      </div>
                      {isActive && (
                        <div className="flex-shrink-0 ml-4">
                          <svg
                            className="w-5 h-5 text-indigo-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No subjects assigned
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full group flex items-center justify-center space-x-3 p-5 rounded-2xl bg-red-50 border-2 border-red-100 text-red-600 font-extrabold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 cursor-pointer"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
