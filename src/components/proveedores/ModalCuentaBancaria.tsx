"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import CustomSelect from "@/components/ui/CustomSelect";

type CuentaBancaria = {
    banco: string;
    tipo_cuenta: string;
    moneda: string;
    numero_cuenta: string;
    cci: string;
    titular_cuenta: string;
    es_principal: boolean;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onGuardar: (cuenta: CuentaBancaria) => void;
    cuentaInicial?: CuentaBancaria | null;
};

const BANCO_OPTIONS = [
    { value: "BCP", label: "BCP", color: "#F58220" },
    { value: "BBVA", label: "BBVA", color: "#004481" },
    { value: "Interbank", label: "Interbank", color: "#00A94F" },
    { value: "Scotiabank", label: "Scotiabank", color: "#D71920" },
    {
        value: "Banco de la Nación",
        label: "Banco de la Nación",
        color: "#C8102E",
    },
    { value: "Otro", label: "Otro", color: "#FFFFFF" },
];

const initialState: CuentaBancaria = {
    banco: "",
    tipo_cuenta: "",
    moneda: "PEN",
    numero_cuenta: "",
    cci: "",
    titular_cuenta: "",
    es_principal: false,
};

export default function ModalCuentaBancaria({
    open,
    onClose,
    onGuardar,
    cuentaInicial,
}: Props) {
    const [form, setForm] = useState(initialState);

    useEffect(() => {
        if (cuentaInicial) {
            setForm(cuentaInicial);
        } else {
            setForm(initialState);
        }
    }, [cuentaInicial, open]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value, type, checked } = e.target as HTMLInputElement;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                cuentaInicial
                    ? "Editar cuenta bancaria"
                    : "Nueva cuenta bancaria"
            }
            width="sm"
        >
            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Banco
                    </label>

                    <CustomSelect
                        name="banco"
                        value={form.banco}
                        options={BANCO_OPTIONS}
                        onChange={(value) =>
                            setForm((prev) => ({
                                ...prev,
                                banco: value,
                            }))
                        }
                        placeholder="Selecciona un banco"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Tipo de cuenta
                        </label>

                        <select
                            name="tipo_cuenta"
                            value={form.tipo_cuenta}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20"
                        >
                            <option value="">Seleccionar</option>
                            <option value="ahorros">Ahorros</option>
                            <option value="corriente">Corriente</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Moneda
                        </label>

                        <select
                            name="moneda"
                            value={form.moneda}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20"
                        >
                            <option value="PEN">Soles (PEN)</option>
                            <option value="USD">Dólares (USD)</option>
                        </select>
                    </div>
                </div>

                <Campo
                    label="Número de cuenta"
                    name="numero_cuenta"
                    value={form.numero_cuenta}
                    onChange={handleChange}
                />

                <Campo
                    label="CCI"
                    name="cci"
                    value={form.cci}
                    onChange={handleChange}
                />

                <Campo
                    label="Titular"
                    name="titular_cuenta"
                    value={form.titular_cuenta}
                    onChange={handleChange}
                />

                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        name="es_principal"
                        checked={form.es_principal}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300"
                    />

                    Cuenta principal
                </label>

                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() => onGuardar(form)}
                        className="rounded-lg bg-[#2F73D9] px-5 py-2 text-sm font-semibold text-white hover:bg-[#245DB3]"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function Campo({
    label,
    name,
    value,
    onChange,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                {label}
            </label>

            <input
                name={name}
                value={value}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20"
            />
        </div>
    );
}