import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { DashboardData } from "@/lib/supabase/dashboard";
import { formatCurrencyNoDecimals } from "@/lib/utils/number";

// Register a standard font if needed, but default Helvetica is fine for now.
// We can register custom fonts later if requested.

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 30,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0F172A",
    },
    subtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#334155",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    summaryGrid: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        padding: 10,
        backgroundColor: "#F8FAFC",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    cardLabel: {
        fontSize: 10,
        color: "#64748B",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0F172A",
    },
    table: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 4,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F1F5F9",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        padding: 8,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        padding: 8,
    },
    colDate: { width: "15%", fontSize: 9 },
    colCategory: { width: "25%", fontSize: 9 },
    colNote: { width: "30%", fontSize: 9, color: "#64748B" },
    colAmount: { width: "15%", fontSize: 9, textAlign: "right", fontWeight: "bold" },
    colPerson: { width: "15%", fontSize: 9, textAlign: "right", color: "#64748B" },

    budgetRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    budgetLabel: { fontSize: 10, color: "#334155" },
    budgetBarBg: {
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        flex: 1,
        marginHorizontal: 10,
    },
    budgetBarFill: {
        height: 6,
        borderRadius: 3,
    },
    budgetValue: { fontSize: 10, color: "#64748B", width: 80, textAlign: "right" },
    budgetExcess: { fontSize: 8, color: "#EF4444", marginTop: 2 },
});

interface MonthlyReportPDFProps {
    data: DashboardData;
    monthKey: string;
}

export function MonthlyReportPDF({ data, monthKey }: MonthlyReportPDFProps) {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 15);
    const monthLabel = format(date, "MMMM yyyy", { locale: es });

    const budgetItems = data.categories
        .filter((c) => (c.budget ?? 0) > 0)
        .sort((a, b) => (b.expense / (b.budget || 1)) - (a.expense / (a.budget || 1)))
        .slice(0, 8); // Top 8 budgets to fit page

    const sortedTransactions = [...data.transactions].sort((a, b) =>
        a.category.localeCompare(b.category) || new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Reporte Financiero</Text>
                    <Text style={styles.subtitle}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</Text>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Ingresos</Text>
                        <Text style={[styles.cardValue, { color: "#10B981" }]}>
                            {formatCurrencyNoDecimals(data.totals.incomes)}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Gastos</Text>
                        <Text style={[styles.cardValue, { color: "#EF4444" }]}>
                            {formatCurrencyNoDecimals(data.totals.expenses)}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Balance</Text>
                        <Text style={[styles.cardValue, { color: "#3B82F6" }]}>
                            {formatCurrencyNoDecimals(data.totals.balance)}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardLabel}>Tasa de Ahorro</Text>
                        <Text style={styles.cardValue}>
                            {Math.round(data.totals.savingsRate * 100)}%
                        </Text>
                    </View>
                </View>

                {/* Budgets Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Presupuestos Principales</Text>
                    {budgetItems.map((item) => {
                        const planned = item.budget ?? 0;
                        const percent = Math.min((item.expense / planned) * 100, 100);
                        const color = percent > 100 ? "#EF4444" : percent > 80 ? "#F59E0B" : "#3B82F6";
                        const excess = item.expense > planned ? item.expense - planned : 0;

                        return (
                            <View key={item.category} style={styles.budgetRow}>
                                <Text style={[styles.budgetLabel, { width: 100 }]}>{item.category}</Text>
                                <View style={styles.budgetBarBg}>
                                    <View style={[styles.budgetBarFill, { width: `${percent}%`, backgroundColor: color }]} />
                                </View>
                                <View style={{ alignItems: "flex-end", width: 80 }}>
                                    <Text style={styles.budgetValue}>
                                        {Math.round(percent)}%
                                    </Text>
                                    {excess > 0 && (
                                        <Text style={styles.budgetExcess}>
                                            +{formatCurrencyNoDecimals(excess)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                    {budgetItems.length === 0 && (
                        <Text style={{ fontSize: 10, color: "#94A3B8" }}>No hay presupuestos registrados.</Text>
                    )}
                </View>

                {/* Transactions Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transacciones</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.colDate}>Fecha</Text>
                            <Text style={styles.colCategory}>Categoría</Text>
                            <Text style={styles.colNote}>Nota</Text>
                            <Text style={styles.colAmount}>Monto</Text>
                            <Text style={styles.colPerson}>Persona</Text>
                        </View>
                        {sortedTransactions.map((tx, i) => (
                            <View key={tx.id} style={[styles.tableRow, { borderBottomWidth: i === sortedTransactions.length - 1 ? 0 : 1 }]}>
                                <Text style={styles.colDate}>{format(new Date(tx.date), "dd MMM")}</Text>
                                <Text style={styles.colCategory}>{tx.category}</Text>
                                <Text style={styles.colNote}>{tx.nota || "-"}</Text>
                                <Text style={[styles.colAmount, { color: tx.tipo === "ingreso" ? "#10B981" : "#EF4444" }]}>
                                    {tx.tipo === "gasto" ? "-" : "+"} {formatCurrencyNoDecimals(tx.monto)}
                                </Text>
                                <Text style={styles.colPerson}>{tx.persona}</Text>
                            </View>
                        ))}
                        {data.transactions.length === 0 && (
                            <View style={{ padding: 10 }}>
                                <Text style={{ fontSize: 10, color: "#94A3B8", textAlign: "center" }}>No hay transacciones.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
}
