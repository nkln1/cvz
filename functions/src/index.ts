import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { DocumentSnapshot } from "firebase-admin/firestore";

admin.initializeApp();

interface OfferData {
  userId: string;
  requestTitle: string;
  serviceId: string;
  price: number;
  description: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: admin.firestore.Timestamp;
}

interface UserData {
  fcmToken?: string;
  email: string;
  name: string;
}

interface ServiceData extends UserData {
  companyName: string;
}

export const onNewOffer = functions.firestore
  .document("offers/{offerId}")
  .onCreate(async (snapshot: DocumentSnapshot, context) => {
    const offerData = snapshot.data() as OfferData;
    const userId = offerData.userId;

    try {
      // Get the user's FCM token
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      const userData = userDoc.data() as UserData | undefined;

      if (userData?.fcmToken) {
        const message = {
          notification: {
            title: "New Offer Received",
            body: `You have received a new offer for your request: ${offerData.requestTitle}`,
          },
          data: {
            offerId: snapshot.id,
            requestTitle: offerData.requestTitle,
            price: offerData.price.toString(),
            click_action: "OPEN_OFFER_DETAILS",
          },
          token: userData.fcmToken,
        };

        await admin.messaging().send(message);
        console.log(`Notification sent successfully to user ${userId}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      if (error instanceof Error) {
        functions.logger.error("Notification error", {
          error: error.message,
          userId,
          offerId: snapshot.id,
        });
      }
    }
  });

// Function to send notifications to service providers about new requests
export const onNewRequest = functions.firestore
  .document("requests/{requestId}")
  .onCreate(async (snapshot: DocumentSnapshot, context) => {
    const requestData = snapshot.data();
    if (!requestData) return;

    try {
      // Get all service providers in the same city
      const servicesSnapshot = await admin.firestore()
        .collection("services")
        .where("city", "==", requestData.city)
        .get();

      const notifications = servicesSnapshot.docs.map(async (doc) => {
        const serviceData = doc.data() as ServiceData;
        if (serviceData.fcmToken) {
          const message = {
            notification: {
              title: "New Service Request",
              body: `New request available in ${requestData.city}: ${requestData.title}`,
            },
            data: {
              requestId: snapshot.id,
              city: requestData.city,
              title: requestData.title,
              click_action: "OPEN_REQUEST_DETAILS",
            },
            token: serviceData.fcmToken,
          };

          try {
            await admin.messaging().send(message);
            console.log(`Notification sent successfully to service ${doc.id}`);
          } catch (error) {
            console.error(`Failed to send notification to service ${doc.id}:`, error);
            if (error instanceof Error) {
              functions.logger.error("Service notification error", {
                error: error.message,
                serviceId: doc.id,
                requestId: snapshot.id,
              });
            }
          }
        }
      });

      await Promise.all(notifications.filter(Boolean));
    } catch (error) {
      console.error("Error sending notifications:", error);
      if (error instanceof Error) {
        functions.logger.error("Batch notification error", {
          error: error.message,
          requestId: snapshot.id,
        });
      }
    }
  });