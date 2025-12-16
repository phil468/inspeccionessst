<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;

class ManageUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:manage 
                            {action : Action to perform: list, activate, deactivate, assign-role, remove-role}
                            {--email= : User email}
                            {--id= : User ID}
                            {--role= : Role name}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage users from command line';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');

        switch ($action) {
            case 'list':
                $this->listUsers();
                break;

            case 'activate':
                $this->activateUser();
                break;

            case 'deactivate':
                $this->deactivateUser();
                break;

            case 'assign-role':
                $this->assignRole();
                break;

            case 'remove-role':
                $this->removeRole();
                break;

            default:
                $this->error("Invalid action: {$action}");
                $this->info("Available actions: list, activate, deactivate, assign-role, remove-role");
                return 1;
        }

        return 0;
    }

    private function listUsers()
    {
        $users = User::with('roles')->get();

        $this->info("Total users: " . $users->count());
        $this->newLine();

        $headers = ['ID', 'Name', 'Email', 'Active', 'Roles'];
        $rows = [];

        foreach ($users as $user) {
            $roles = $user->roles->pluck('nombre')->join(', ');
            $rows[] = [
                $user->id,
                $user->name,
                $user->email,
                $user->activo ? '✓' : '✗',
                $roles ?: '-',
            ];
        }

        $this->table($headers, $rows);
    }

    private function activateUser()
    {
        $user = $this->findUser();
        if (!$user) return;

        $user->update(['activo' => true]);
        $this->info("User '{$user->name}' activated successfully");
    }

    private function deactivateUser()
    {
        $user = $this->findUser();
        if (!$user) return;

        $user->update(['activo' => false]);
        $this->warn("User '{$user->name}' deactivated successfully");
    }

    private function assignRole()
    {
        $user = $this->findUser();
        if (!$user) return;

        $roleName = $this->option('role');
        if (!$roleName) {
            $this->error("Role name is required. Use --role=RoleName");
            return;
        }

        $role = Role::where('nombre', $roleName)->first();
        if (!$role) {
            $this->error("Role '{$roleName}' not found");
            $this->info("Available roles: " . Role::pluck('nombre')->join(', '));
            return;
        }

        $user->assignRole($role);
        $this->info("Role '{$roleName}' assigned to user '{$user->name}'");
    }

    private function removeRole()
    {
        $user = $this->findUser();
        if (!$user) return;

        $roleName = $this->option('role');
        if (!$roleName) {
            $this->error("Role name is required. Use --role=RoleName");
            return;
        }

        $role = Role::where('nombre', $roleName)->first();
        if (!$role) {
            $this->error("Role '{$roleName}' not found");
            return;
        }

        $user->removeRole($role);
        $this->info("Role '{$roleName}' removed from user '{$user->name}'");
    }

    private function findUser()
    {
        $email = $this->option('email');
        $id = $this->option('id');

        if (!$email && !$id) {
            $this->error("User email or ID is required. Use --email=user@example.com or --id=1");
            return null;
        }

        $user = null;
        if ($email) {
            $user = User::where('email', $email)->first();
        } elseif ($id) {
            $user = User::find($id);
        }

        if (!$user) {
            $this->error("User not found");
            return null;
        }

        return $user;
    }
}
