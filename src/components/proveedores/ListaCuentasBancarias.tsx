"use client";

import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import ModalCuentaBancaria from "./ModalCuentaBancaria";
import Modal from "../ui/Modal";

export type CuentaBancaria = {
    id?: string;
    banco: string;
    tipo_cuenta: string;
    moneda: string;
    numero_cuenta: string;
    cci: string;
    titular_cuenta: string;
    es_principal: boolean;
};

type Props = {
    value: CuentaBancaria[];
    onChange: (cuentas: CuentaBancaria[]) => void;
};

export default function ListaCuentasBancarias({
    value,
    onChange,
}: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [indiceEditar, setIndiceEditar] = useState<number | null>(null);
    const [modalEliminar, setModalEliminar] = useState(false);
    const [indiceEliminar, setIndiceEliminar] = useState<number | null>(null);

    const cuentaEditar =
        indiceEditar !== null ? value[indiceEditar] : null;

    function nuevaCuenta() {
        setIndiceEditar(null);
        setModalOpen(true);
    }

    function editarCuenta(index: number) {
        setIndiceEditar(index);
        setModalOpen(true);
    }

    function cerrarModal() {
        setModalOpen(false);
        setIndiceEditar(null);
    }

    function guardarCuenta(cuenta: CuentaBancaria) {
        let nuevasCuentas = [...value];

        // Solo puede existir una cuenta principal
        if (cuenta.es_principal) {
            nuevasCuentas = nuevasCuentas.map((cuentaActual) => ({
                ...cuentaActual,
                es_principal: false,
            }));
        }

        if (indiceEditar !== null) {
            nuevasCuentas[indiceEditar] = {
                ...cuenta,
                id: value[indiceEditar]?.id,
            };
        } else {
            nuevasCuentas.push(cuenta);
        }

        onChange(nuevasCuentas);
        cerrarModal();
    }

    function eliminarCuenta(index: number) {
        setIndiceEliminar(index);
        setModalEliminar(true);
    }
    function confirmarEliminarCuenta() {
        if (indiceEliminar === null) return;

        const nuevasCuentas = value.filter(
            (_, index) => index !== indiceEliminar
        );

        onChange(nuevasCuentas);

        setIndiceEliminar(null);
        setModalEliminar(false);
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-semibold text-[#102033]">
                        5. Cuentas bancarias
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Puedes registrar una o varias cuentas ahora o agregarlas
                        posteriormente.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={nuevaCuenta}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245DB3]"
                >
                    <Plus size={17} />
                    Agregar cuenta
                </button>
            </div>

            {value.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center">
                    <p className="text-sm font-medium text-slate-600">
                        No hay cuentas bancarias registradas
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Esta información podrá completarse después.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {value.map((cuenta, index) => (
                        <article
                            key={cuenta.id ?? `${cuenta.numero_cuenta}-${index}`}
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    {cuenta.es_principal && (
                                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                                            <Star
                                                size={14}
                                                className="fill-amber-400 text-amber-400"
                                            />
                                            Cuenta principal
                                        </div>
                                    )}

                                    <h3 className="font-semibold text-[#102033]">
                                        {cuenta.banco}
                                    </h3>

                                    <p className="mt-1 text-sm capitalize text-slate-500">
                                        {cuenta.tipo_cuenta} · {cuenta.moneda}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => editarCuenta(index)}
                                        title="Editar cuenta"
                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#2F73D9]"
                                    >
                                        <Pencil size={17} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => eliminarCuenta(index)}
                                        title="Eliminar cuenta"
                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                                <Dato
                                    label="Número de cuenta"
                                    value={cuenta.numero_cuenta}
                                />

                                <Dato label="CCI" value={cuenta.cci} />

                                <Dato
                                    label="Titular"
                                    value={cuenta.titular_cuenta}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <ModalCuentaBancaria
                open={modalOpen}
                onClose={cerrarModal}
                cuentaInicial={cuentaEditar}
                onGuardar={guardarCuenta}
            />
            <Modal
                open={modalEliminar}
                onClose={() => {
                    setModalEliminar(false);
                    setIndiceEliminar(null);
                }}
                title="Eliminar cuenta bancaria"
                width="sm"
            >
                <div className="space-y-5">
                    <p className="text-sm text-slate-600">
                        ¿Estás seguro de que deseas eliminar esta cuenta bancaria?
                        Esta acción no se puede deshacer.
                    </p>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setModalEliminar(false);
                                setIndiceEliminar(null);
                            }}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={confirmarEliminarCuenta}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function Dato({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="break-all text-sm font-medium text-slate-800">
                {value}
            </p>
        </div>
    );
}