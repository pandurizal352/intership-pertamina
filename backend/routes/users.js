var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // Untuk hashing password
require('dotenv').config();

const prisma = new PrismaClient();

// Create User
router.post('/users', async (req, res) => {
  const { username, password, nama_perusahaan, roleId } = req.body;

  if (!username || !password || !roleId) {
    return res.status(400).json({ error: 'Username, password, dan roleId diperlukan' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: {
          connect: { id: roleId } // Menghubungkan role berdasarkan roleId
        },
        perusahaan: nama_perusahaan ? { connect: { nama_perusahaan } } : undefined // Opsional, jika ada perusahaan
      }
    });

    res.status(201).json({ message: 'User berhasil dibuat', user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read Users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true,perusahaan: true },
      orderBy: {
        role: {
          name: 'asc' // Urutkan berdasarkan nama role secara ascending
        }
      }
    });

    const userData = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role.name,
      nama_perusahaan: user.perusahaan?.nama_perusahaan 
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, nama_perusahaan, roleId } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        username,
        role: {
          connect: { id: roleId }
        },
        perusahaan: nama_perusahaan ? { connect: { nama_perusahaan } } : undefined
      }
    });

    res.json({ message: 'User berhasil diperbarui', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Password
router.put('/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'Password baru diperlukan' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: 'Password berhasil diubah', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await prisma.user.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: `User dengan ID ${id} berhasil dihapus`, user: deletedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
