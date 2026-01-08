<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificacionInspeccion extends Mailable
{
    use Queueable, SerializesModels;

    public $personal;
    public $inspeccion;
    public $resultados;
    public $roles;
    public $tipo;

    /**
     * Create a new message instance.
     */
    public function __construct($personal, $inspeccion, $resultados, $roles, $tipo)
    {
        $this->personal = $personal;
        $this->inspeccion = $inspeccion;
        $this->resultados = $resultados;
        $this->roles = $roles;
        $this->tipo = $tipo;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->tipo === 'felicitaciones'
            ? "✓ Inspección Completada - {$this->inspeccion->empresa->name}"
            : "⚠ Resultados Pendientes - {$this->inspeccion->empresa->name}";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.notificacion-inspeccion',
            with: [
                'personal' => $this->personal,
                'inspeccion' => $this->inspeccion,
                'resultados' => $this->resultados,
                'roles' => $this->roles,
                'tipo' => $this->tipo,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
