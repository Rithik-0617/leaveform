import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface LeaveRequest {
  id: string;
  userId: string;
  empId: string;
  department: string;
  leaveType: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  fileUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remark?: string;
  createdAt: Date;
  userName?: string;
}

export const createLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'leaveRequests'), {
      ...requestData,
      fromDate: Timestamp.fromDate(requestData.fromDate),
      toDate: Timestamp.fromDate(requestData.toDate),
      status: 'Pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getLeaveRequests = async (userId?: string): Promise<LeaveRequest[]> => {
  try {
    let querySnapshot;
    
    if (userId) {
      // For staff: get only their requests
      const q = query(
        collection(db, 'leaveRequests'),
        where('userId', '==', userId)
      );
      querySnapshot = await getDocs(q);
    } else {
      // For directors: get all requests
      const q = query(
        collection(db, 'leaveRequests')
      );
      querySnapshot = await getDocs(q);
    }

    const requests: LeaveRequest[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Get user name
      const userDoc = await getDoc(doc(db, 'users', data.userId));
      const userName = userDoc.exists() ? userDoc.data().name : 'Unknown User';

      requests.push({
        id: docSnapshot.id,
        ...data,
        fromDate: data.fromDate.toDate(),
        toDate: data.toDate.toDate(),
        createdAt: data.createdAt.toDate(),
        userName,
      } as LeaveRequest);
    }

    // Sort by createdAt in memory (newest first)
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return requests;
  } catch (error) {
    throw error;
  }
};

export const updateLeaveRequestStatus = async (
  requestId: string, 
  status: 'Approved' | 'Rejected', 
  remark?: string
) => {
  try {
    const updateData: any = { status };
    if (remark) {
      updateData.remark = remark;
    }

    await updateDoc(doc(db, 'leaveRequests', requestId), updateData);
  } catch (error) {
    throw error;
  }
};

export const uploadFile = async (file: any, userId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `leave-documents/${fileName}`);

    // For web, we need to handle the file differently
    let fileBlob;
    if (file.uri) {
      // React Native file
      const response = await fetch(file.uri);
      fileBlob = await response.blob();
    } else {
      // Web file
      fileBlob = file;
    }

    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    throw error;
  }
};