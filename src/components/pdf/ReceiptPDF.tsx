"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30 },
  section: { marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  text: { fontSize: 12 },
  label: { fontWeight: "bold" },
});

type Props = {
  bill: {
    id: string;
    status: string;
    createdAt: string;
    rentAmount: number;
    waterBill: number;
    electricityBill: number;
    totalAmount: number;
    transactionRef?: string;
    tenant: {
      firstName: string;
      lastName: string;
      roomNumber: string;
    };
  };
};

export const ReceiptPDF = ({ bill }: Props) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>ใบเสร็จค่าหอพัก</Text>
          <Text style={styles.text}>
            <Text style={styles.label}>รหัสบิล:</Text> {bill.id}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>วันที่ชำระ:</Text>{" "}
            {new Date(bill.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>
            <Text style={styles.label}>ผู้เช่า:</Text>{" "}
            {bill.tenant.firstName} {bill.tenant.lastName}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>ห้อง:</Text> {bill.tenant.roomNumber}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>
            <Text style={styles.label}>ค่าเช่าห้อง:</Text> ฿{bill.rentAmount}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>ค่าน้ำ:</Text> ฿{bill.waterBill}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>ค่าไฟ:</Text> ฿{bill.electricityBill}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>รวมทั้งสิ้น:</Text> ฿{bill.totalAmount}
          </Text>
        </View>

        {bill.transactionRef && (
          <View style={styles.section}>
            <Text style={styles.text}>
              <Text style={styles.label}>รหัสธุรกรรม:</Text>{" "}
              {bill.transactionRef}
            </Text>
          </View>
        )}

        <Text style={{ marginTop: 20, fontSize: 10 }}>
          *เอกสารนี้ใช้สำหรับเป็นหลักฐานการชำระเงินเท่านั้น
        </Text>
      </Page>
    </Document>
  );
};
