<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de Inspección</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }

        .header-felicitaciones {
            background-color: #28a745;
        }

        .header-pendientes {
            background-color: #f5576c;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }

        .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .content {
            padding: 30px 20px;
        }

        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
        }

        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .info-box h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 16px;
        }

        .info-box p {
            margin: 5px 0;
            font-size: 14px;
        }

        .resultados {
            margin: 20px 0;
        }

        .resultado-item {
            background-color: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .resultado-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .resultado-titulo {
            font-weight: 600;
            color: #333;
            font-size: 16px;
        }

        .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-pendiente {
            background-color: #fee;
            color: #c33;
        }

        .badge-proceso {
            background-color: #fff3cd;
            color: #856404;
        }

        .badge-ejecutado {
            background-color: #d1ecf1;
            color: #0c5460;
        }

        .badge-cerrado {
            background-color: #d4edda;
            color: #155724;
        }

        .resultado-descripcion {
            color: #666;
            font-size: 14px;
            margin-top: 8px;
        }

        .riesgo {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
        }

        .riesgo-alto {
            background-color: #fee;
            color: #c33;
        }

        .riesgo-medio {
            background-color: #fff3cd;
            color: #856404;
        }

        .riesgo-bajo {
            background-color: #d4edda;
            color: #155724;
        }

        .roles-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #e7f3ff;
            border-radius: 6px;
        }

        .roles-info h4 {
            margin: 0 0 10px 0;
            color: #0066cc;
            font-size: 14px;
        }

        .role-badge {
            display: inline-block;
            background-color: #0066cc;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            margin-right: 6px;
            margin-bottom: 6px;
        }

        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }

        .footer a {
            color: #667eea;
            text-decoration: none;
        }

        .btn-ver-inspeccion {
            display: inline-block;
            background-color: #667eea;
            color: #ffffff !important;
            padding: 14px 32px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }

        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }

        .cta-section p {
            margin-bottom: 15px;
            color: #555;
        }
    </style>
    <!--[if mso]>
    <style type="text/css">
        .btn-ver-inspeccion {
            background-color: #667eea !important;
        }
    </style>
    <![endif]-->
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header {{ $tipo === 'felicitaciones' ? 'header-felicitaciones' : 'header-pendientes' }}">
            <div class="header-icon">
                {{ $tipo === 'felicitaciones' ? '✓' : '⚠' }}
            </div>
            <h1>
                {{ $tipo === 'felicitaciones' ? 'Inspección Completada' : 'Resultados Pendientes' }}
            </h1>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="greeting">
                Hola <strong>{{ $personal->nombres }} {{ $personal->apellido_paterno }}</strong>,
            </p>

            @if ($tipo === 'felicitaciones')
                <p>¡Felicitaciones! Se han completado todos los resultados de la inspección.</p>
            @else
                <p>Tienes resultados pendientes que requieren tu atención en la siguiente inspección:</p>
            @endif

            <!-- Información de la Inspección -->
            <div class="info-box">
                <h3>📋 Detalles de la Inspección</h3>
                <h4><strong>Número de Registro:</strong> {{ $inspeccion->numero_registro ?? 'N/A' }}</h4>
                <p><strong>Empresa:</strong> {{ $inspeccion->empresa->name ?? 'N/A' }}</p>
                <p><strong>Sede:</strong> {{ $inspeccion->fundo->nombre ?? ($inspeccion->fundo_nombre ?? 'N/A') }}</p>
                <p><strong>Área:</strong> {{ $inspeccion->area->name ?? 'N/A' }}</p>
                <p><strong>Fecha:</strong> {{ \Carbon\Carbon::parse($inspeccion->fecha_inspeccion)->format('d/m/Y') }}
                </p>
                <p><strong>Tipo:</strong> {{ $inspeccion->tipo_inspeccion }}</p>
            </div>

            <!-- Roles asignados -->
            @if (count($roles) > 0)
                <div class="roles-info">
                    <h4>Tus roles en esta inspección:</h4>
                    @foreach ($roles as $rol)
                        <span class="role-badge">
                            @if ($rol === 'responsable')
                                Responsable del Levantamiento
                            @elseif($rol === 'visor')
                                Visor (Solo Lectura)
                            @elseif($rol === 'responsable_levantamiento')
                                Responsable de Levantamiento
                            @endif
                        </span>
                    @endforeach
                </div>
            @endif

            <!-- Resultados/Hallazgos -->
            <div class="resultados">
                <h3>Resultados Asignados ({{ count($resultados) }})</h3>

                @foreach ($resultados as $index => $resultado)
                    <div class="resultado-item">
                        <div class="resultado-header">
                            <span class="resultado-titulo">Resultado #{{ $index + 1 }}</span>
                            <span class="badge badge-{{ strtolower($resultado->estado) }}">
                                {{ $resultado->estado }}
                            </span>
                        </div>

                        <p class="resultado-descripcion">
                            {{ $resultado->descripcion }}
                        </p>

                        <div>
                            <span class="riesgo riesgo-{{ strtolower($resultado->nivel_riesgo) }}">
                                Riesgo {{ $resultado->nivel_riesgo }}
                            </span>
                        </div>

                        @if ($resultado->accion_tomar)
                            <p style="margin-top: 10px; font-size: 13px; color: #555;">
                                <strong>Acción:</strong> {{ $resultado->accion_tomar }}
                            </p>
                        @endif

                        {{-- agregar responsable de resultado --}}

                        @if (isset($resultado->responsable))
                            <p style="margin-top: 8px; font-size:13px; color:#444;">
                                <strong>Responsable del Resultado:</strong>
                                {{ $resultado->responsable->nombres ?? '' }}
                                {{ $resultado->responsable->apellido_paterno ?? '' }}
                            </p>
                        @endif


                        @if (isset($resultado->responsablesLevantamiento) && count($resultado->responsablesLevantamiento) > 0)
                            <p style="margin-top: 8px; font-size:13px; color:#444;">
                                <strong>Responsable(s) de Levantamiento:</strong>
                                @foreach ($resultado->responsablesLevantamiento as $r)
                                    {{ ($r->nombres ?? ($r->personal->nombres ?? '')) . ' ' . ($r->apellido_paterno ?? ($r->personal->apellido_paterno ?? '')) }}
                                    @if (!$loop->last)
                                        ,
                                    @endif
                                @endforeach
                            </p>
                        @endif

                        @if (isset($resultado->foto_final_estado) && $resultado->foto_final_estado === 'rechazada')
                            <p style="margin-top:8px; font-size:13px; color:#c33;">
                                <strong>Registro fotográfico por corregir:</strong>
                                <br>
                                @if (!empty($resultado->foto_final_comentario))
                                    <em>{{ $resultado->foto_final_comentario }}</em>
                                @else
                                    <em>Sin comentarios.</em>
                                @endif
                            </p>
                        @endif
                    </div>
                @endforeach
            </div>

            <!-- Botón para ver inspección -->
            <div class="cta-section">
                @if ($tipo === 'pendientes')
                    <p>Ingresa al sistema para revisar y trabajar en estos resultados:</p>
                @else
                    <p>Puedes ver los detalles de la inspección aquí:</p>
                @endif

                <!-- Botón bulletproof compatible con Outlook -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
                    style="margin: auto;">
                    <tr>
                        <td style="border-radius: 25px; background-color: #667eea;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ config('app.frontend_url') }}/mis-inspecciones" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="50%" strokecolor="#667eea" fillcolor="#667eea">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">📋 Ver Inspección</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="{{ config('app.frontend_url') }}/mis-inspecciones/{{ $inspeccion->id }}"
                                style="background-color: #667eea; border-radius: 25px; color: #ffffff; display: inline-block; font-family: sans-serif; font-size: 16px; font-weight: bold; line-height: 48px; text-align: center; text-decoration: none; width: 200px; -webkit-text-size-adjust: none;">
                                📋 Ver Inspección
                            </a>
                            <!--<![endif]-->
                        </td>
                    </tr>
                </table>
            </div>

            @if ($tipo === 'felicitaciones')
                <p style="margin-top: 20px; font-size: 14px; color: #666; text-align: center;">
                    Gracias por tu compromiso con la seguridad y calidad en el trabajo.
                </p>
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Este es un correo automático del Sistema de Inspecciones SST.</p>
            <p>Si tienes alguna duda, contacta al administrador del sistema.</p>
        </div>
    </div>
</body>

</html>
